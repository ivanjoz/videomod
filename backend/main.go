package main

import (
	"app/core"
	"app/handlers"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"runtime/debug"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
)

func LambdaHandler(_ context.Context, request *core.APIGatewayV2HTTPRequest) (*events.APIGatewayProxyResponse, error) {
	clearEnvVariables()

	requestJson, _ := json.Marshal(*request)
	fmt.Println("Request: ")
	fmt.Println(string(requestJson))

	core.Env.REQ_IP = request.RequestContext.HTTP.SourceIP
	if len(request.Body) > 0 {
		core.Log("*body enviado: ", core.StrCut(request.Body, 400))
	}

	args := core.HandlerArgs{
		Body:         &request.Body,
		Query:        request.QueryStringParameters,
		Headers:      request.Headers,
		Route:        request.RequestContext.HTTP.Path,
		Method:       request.RequestContext.HTTP.Method,
		EventType:    request.RequestContext.EventType,
		ConnectionID: request.RequestContext.ConnectionID,
		IsWebSocket:  true,
	}

	wssEvents := []string{"CONNECT", "DISCONNECT", "MESSAGE"}
	fmt.Println("Event type: ", args.EventType)
	response := core.MainResponse{}
	// Revisa si es websocket
	if core.Contains(wssEvents, args.EventType) {
		if args.EventType != "MESSAGE" {
			return &events.APIGatewayProxyResponse{StatusCode: 200, Body: "OK"}, nil
		}
		fmt.Println("Parseando websocket:: ", args.ConnectionID)
		awsArgs := ParseWssMessage(&request.Body)
		args.Body = awsArgs.Body
		args.Route = awsArgs.Route
		args.ClientID = awsArgs.ClientID
		fmt.Println("Determinando ruta:: ", args.Route)
	} else {
		fmt.Println("Es HTTP request::")
		if len(args.Route) == 0 {
			args.Route = request.RawPath
		}
		if len(args.Route) == 0 {
			fmt.Println("No path given, but AWS routed this request anyways.")
			args.Route = "MISSING"
		}
	}

	response = mainHandler(args)
	fmt.Println("Retornano StatusCode: ", response.LambdaResponse.StatusCode, "|", response.LambdaResponse.IsBase64Encoded, "|", response.LambdaResponse.Body)

	return &events.APIGatewayProxyResponse{
		StatusCode:      response.LambdaResponse.StatusCode,
		Body:            response.LambdaResponse.Body,
		Headers:         response.LambdaResponse.Headers,
		IsBase64Encoded: response.LambdaResponse.IsBase64Encoded,
	}, nil
}

func LocalHandler(w http.ResponseWriter, request *http.Request) {
	clearEnvVariables()
	core.Env.REQ_IP = request.RemoteAddr

	bodyBytes, _ := io.ReadAll(request.Body)
	body := string(bodyBytes)

	args := core.HandlerArgs{
		Body:           &body,
		Method:         strings.ToUpper(request.Method),
		Route:          request.URL.Path,
		Headers:        map[string]string{},
		Query:          map[string]string{},
		ResponseWriter: &w,
	}

	for key, values := range request.URL.Query() {
		value := strings.Join(values[:], ",")
		args.Query[key] = value
	}

	for key, values := range request.Header {
		value := strings.Join(values[:], ",")
		args.Headers[key] = value
	}

	mainHandler(args)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func LocalWssHandler(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a websocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	// Make sure we close the connection when the function returns
	defer ws.Close()
	core.Log("Client connected")

	for {
		// Read in a new message as JSON and map it to a Message object
		_, messageBytes, err := ws.ReadMessage()
		if err != nil {
			log.Printf("error: %v", err)
			break
		}
		message := string(messageBytes)
		core.Log("Mensaje recibido: ", message)
		args := ParseWssMessage(&message)
		args.IsWebSocket = true
		args.WebSocketConn = ws

		if len(args.ResponseError) > 0 {
			core.Log(args.ResponseError)
		}
		mainHandler(args)
	}
}

func ParseWssMessage(body *string) core.HandlerArgs {
	compressedBytes, err := core.Base94Decode(*body)
	if err != nil {
		return core.HandlerArgs{
			ResponseError: fmt.Sprintf("Error al decodificar el mensaje: %v", err),
		}
	}
	core.Log("bytes comprimidos::", len(compressedBytes))
	messageRaw := core.DecompressGzipBytes(&compressedBytes)
	message := core.WsMessage{}
	err = json.Unmarshal(messageRaw, &message)
	if err != nil {
		return core.HandlerArgs{
			ResponseError: fmt.Sprintf("Error al deserializar el mensaje: %v", err),
		}
	}
	return core.HandlerArgs{
		Body:     &message.Body,
		Route:    message.Accion,
		ClientID: message.ClientID,
	}
}

func OnPanic(panicMessage interface{}) {
	core.Logx(5, "Error 500 (Panic): ", panicMessage)
	core.Log(string(debug.Stack()))
}

func main() {
	serverPort := ":3589"
	core.PopulateVariables()

	if !core.Env.IS_LOCAL { // Controla los panic error
		defer func() {
			if r := recover(); r != nil {
				OnPanic(r)
			}
		}()
	}

	for _, value := range os.Args[1:] {
		fmt.Println("Argumento: ", value)
		if value == "prod" {
			core.Env.APP_CODE = "app-prod"
		}
		if fn, ok := handlers.DemoFuncs[value]; ok {
			fn()
			return
		}
	}

	// For local development
	if core.Env.IS_LOCAL {
		cors := cors.New(cors.Options{
			AllowedOrigins:   []string{"*"},
			AllowedMethods:   []string{http.MethodPost, http.MethodPut, http.MethodGet},
			AllowedHeaders:   []string{"*"},
			AllowCredentials: false,
		})

		mux := http.NewServeMux()
		// HTTP server
		core.Log("Ejecutando HTTP server: localhost" + serverPort)
		mux.Handle("/", cors.Handler(http.HandlerFunc(LocalHandler)))
		// WebSocket server
		mux.HandleFunc("/ws", LocalWssHandler)

		// Start the server with the ServeMux
		err := http.ListenAndServe(serverPort, mux)
		if err != nil {
			log.Fatal("Server start error: ", err)
		}
	} else {
		// Si se está en Lamnda
		logger := log.New(os.Stdout, "", log.LstdFlags|log.Llongfile)
		logger.Println("Lambda has started.")
		// The main goroutine in a Lambda might never run its deferred statements.
		// This is because of how the Lambda is shutdown.
		defer logger.Println("Lambda has stopped.")

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		lambda.StartWithOptions(LambdaHandler, lambda.WithContext(ctx))
	}
}
