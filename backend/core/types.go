package core

import (
	"encoding/json"
	"strconv"
)

type APIGatewayV2HTTPRequest struct {
	Version               string                         `json:"version"`
	RouteKey              string                         `json:"routeKey"`
	RawPath               string                         `json:"rawPath"`
	RawQueryString        string                         `json:"rawQueryString"`
	Cookies               []string                       `json:"cookies,omitempty"`
	Headers               map[string]string              `json:"headers"`
	QueryStringParameters map[string]string              `json:"queryStringParameters,omitempty"`
	PathParameters        map[string]string              `json:"pathParameters,omitempty"`
	RequestContext        APIGatewayV2HTTPRequestContext `json:"requestContext"`
	StageVariables        map[string]string              `json:"stageVariables,omitempty"`
	Body                  string                         `json:"body,omitempty"`
	IsBase64Encoded       bool                           `json:"isBase64Encoded"`
	// Websocket
	Resource                        string              `json:"resource"`
	Path                            string              `json:"path"`
	HTTPMethod                      string              `json:"httpMethod,omitempty"`
	MultiValueQueryStringParameters map[string][]string `json:"multiValueQueryStringParameters"`
}

type APIGatewayWebsocketProxyRequest struct {
	Resource                        string                                 `json:"resource"` // The resource path defined in API Gateway
	Path                            string                                 `json:"path"`     // The url path for the caller
	HTTPMethod                      string                                 `json:"httpMethod,omitempty"`
	Headers                         map[string]string                      `json:"headers"`
	MultiValueHeaders               map[string][]string                    `json:"multiValueHeaders"`
	QueryStringParameters           map[string]string                      `json:"queryStringParameters"`
	MultiValueQueryStringParameters map[string][]string                    `json:"multiValueQueryStringParameters"`
	PathParameters                  map[string]string                      `json:"pathParameters"`
	StageVariables                  map[string]string                      `json:"stageVariables"`
	RequestContext                  APIGatewayWebsocketProxyRequestContext `json:"requestContext"`
	Body                            string                                 `json:"body"`
	IsBase64Encoded                 bool                                   `json:"isBase64Encoded,omitempty"`
}

type APIGatewayV2HTTPRequestContext struct {
	RouteKey     string                                        `json:"routeKey"`
	AccountID    string                                        `json:"accountId"`
	Stage        string                                        `json:"stage"`
	RequestID    string                                        `json:"requestId"`
	APIID        string                                        `json:"apiId"` // The API Gateway HTTP API Id
	DomainName   string                                        `json:"domainName"`
	DomainPrefix string                                        `json:"domainPrefix"`
	Time         string                                        `json:"time"`
	TimeEpoch    int64                                         `json:"timeEpoch"`
	HTTP         APIGatewayV2HTTPRequestContextHTTPDescription `json:"http"`
	//Websocket
	ResourceID         string      `json:"resourceId"`
	Error              string      `json:"error"`
	EventType          string      `json:"eventType"`
	ExtendedRequestID  string      `json:"extendedRequestId"`
	IntegrationLatency string      `json:"integrationLatency"`
	MessageDirection   string      `json:"messageDirection"`
	MessageID          interface{} `json:"messageId"`
	RequestTime        string      `json:"requestTime"`
	RequestTimeEpoch   int64       `json:"requestTimeEpoch"`
	Status             string      `json:"status"`
	ResourcePath       string      `json:"resourcePath"`
	Authorizer         interface{} `json:"authorizer"`
}

type APIGatewayWebsocketProxyRequestContext struct {
	AccountID          string      `json:"accountId"`
	ResourceID         string      `json:"resourceId"`
	Stage              string      `json:"stage"`
	RequestID          string      `json:"requestId"`
	ResourcePath       string      `json:"resourcePath"`
	Authorizer         interface{} `json:"authorizer"`
	HTTPMethod         string      `json:"httpMethod"`
	APIID              string      `json:"apiId"` // The API Gateway rest API Id
	ConnectedAt        int64       `json:"connectedAt"`
	ConnectionID       string      `json:"connectionId"`
	DomainName         string      `json:"domainName"`
	Error              string      `json:"error"`
	EventType          string      `json:"eventType"`
	ExtendedRequestID  string      `json:"extendedRequestId"`
	IntegrationLatency string      `json:"integrationLatency"`
	MessageDirection   string      `json:"messageDirection"`
	MessageID          interface{} `json:"messageId"`
	RequestTime        string      `json:"requestTime"`
	RequestTimeEpoch   int64       `json:"requestTimeEpoch"`
	RouteKey           string      `json:"routeKey"`
	Status             string      `json:"status"`
}

// APIGatewayV2HTTPRequestContextHTTPDescription contains HTTP information for the request context.
type APIGatewayV2HTTPRequestContextHTTPDescription struct {
	Method    string `json:"method"`
	Path      string `json:"path"`
	Protocol  string `json:"protocol"`
	SourceIP  string `json:"sourceIp"`
	UserAgent string `json:"userAgent"`
}

type FuncResponse struct {
	ElapsedTime int    `json:",omitempty"`
	Message     string `json:",omitempty"`
	Error       string `json:",omitempty"`
	Content     map[string]any
	ContentJson string `json:",omitempty"`
}

type AppRouterType map[string]func(args *HandlerArgs) HandlerResponse

type Int int

func (fi *Int) UnmarshalJSON(b []byte) error {
	if b[0] != '"' {
		return json.Unmarshal(b, (*int)(fi))
	}
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	i, err := strconv.Atoi(s)
	if err != nil {
		return err
	}
	*fi = Int(i)
	return nil
}
