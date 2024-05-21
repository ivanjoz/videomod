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

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/rs/cors"
)

func LambdaHandler(_ context.Context, request *core.APIGatewayV2HTTPRequest) (*events.APIGatewayV2HTTPResponse, error) {
	clearEnvVariables()

	requestJson, _ := json.Marshal(*request)
	fmt.Println("Request: ")
	fmt.Println(requestJson)

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
		Body:    &request.Body,
		Query:   request.QueryStringParameters,
		Headers: request.Headers,
		Route:   route,
		Method:  request.RequestContext.HTTP.Method,
	}
	response := mainHandler(args)
	return response.LambdaResponse, nil
}

func LocalHandler(w http.ResponseWriter, request *http.Request) {
	core.Log("hola aquí!!")
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

	blen := core.If(len(body) > 500, 500, len(body))
	if blen > 0 {
		core.Log("*body enviado (LOCAL): ", body[0:(blen-1)])
	} else {
		core.Log("no se encontró body")
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

	// Si se está desarrollando en local
	if core.Env.IS_LOCAL {
		core.Log("Ejecutando en local. http://localhost" + serverPort)

		cors := cors.New(cors.Options{
			AllowedOrigins:   []string{"*"},
			AllowedMethods:   []string{http.MethodPost, http.MethodPut, http.MethodGet},
			AllowedHeaders:   []string{"*"},
			AllowCredentials: false,
		})
		// Inicia el servidor con la configuración CORS
		http.ListenAndServe(serverPort, cors.Handler(http.HandlerFunc(LocalHandler)))

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
