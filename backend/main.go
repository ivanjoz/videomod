package main

import (
	"app/core"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"runtime/debug"
	"strings"

	"unicode/utf8"

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

	route := request.RequestContext.HTTP.Path
	if len(route) == 0 {
		route = request.RawPath
	}
	if len(route) == 0 {
		core.Log("No custom path given, but AWS routed this request to this Lambda anyways.")
		route = "MISSING"
	}

	args := core.HandlerArgs{
		Body:      &request.Body,
		Query:     request.QueryStringParameters,
		Headers:   request.Headers,
		Route:     route,
		Method:    request.RequestContext.HTTP.Method,
		EventType: request.RequestContext.EventType,
	}

	wssEvents := []string{"CONNECT", "DISCONNECT", "MESSAGE"}
	fmt.Println("Event type: ", args.EventType)
	response := core.MainResponse{}
	if core.Contains(wssEvents, args.EventType) {
		if args.EventType == "MESSAGE" {
			args.Body = &request.Body
		}
		response = WssHandler(args)
	} else {
		response = mainHandler(args)
	}

	core.Log("Retornano StatusCode: ", response.LambdaResponse.StatusCode, "|", response.LambdaResponse.IsBase64Encoded, "|", response.LambdaResponse.Body)

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
		ResponseWriter: &w,
	}

	// Convierte los query params en un map[string]: stirng
	queryString := request.URL.Query()
	args.Query = make(map[string]string)

	for key, values := range queryString {
		value := strings.Join(values[:], ",")
		args.Query[key] = value
	}

	// Convierte los headers en un map[string]: string
	args.Headers = make(map[string]string)

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
		_, message, err := ws.ReadMessage()
		if err != nil {
			log.Printf("error: %v", err)
			break
		}
		// Print the message to the console
		core.Log("Is UTF-8:", utf8.Valid(message))
		if !utf8.Valid(message) {
			message = core.DecompressGzipBytes(&message)
		}
		core.Log("Recibido: ", string(message))
		args := ParseWssMessage(message)
		args.IsWebSocket = true
		mainHandler(args)
	}
}

func ParseWssMessage(messageRaw []byte) core.HandlerArgs {
	message := core.WsMessage{}
	err := json.Unmarshal(messageRaw, &message)
	if err != nil {
		core.Log("Error al interpretar el mensaje:", err)
	}
	return core.HandlerArgs{
		Body:     &message.Body,
		Route:    message.Accion,
		ClientID: message.ClientID,
	}
}

// Handler principal (para lambda y para local)
func WssHandler(args core.HandlerArgs) core.MainResponse {

	fmt.Println("Respondiendo status 200 Connected")
	return core.MainResponse{
		LambdaResponse: &events.APIGatewayV2HTTPResponse{
			StatusCode: 200,
			Body:       "Connected",
		},
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

	for _, value := range os.Args {
		if value == "prod" {
			core.Env.APP_CODE = "app-prod"
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
