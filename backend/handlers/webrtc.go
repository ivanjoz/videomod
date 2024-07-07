package handlers

import (
	"app/aws"
	"app/core"
	"encoding/json"
	"time"
)

func PostRtcOffer(args *core.HandlerArgs) core.HandlerResponse {
	offer := aws.RtcClientOffer{}
	offer.Updated = core.ToBase36(time.Now().Unix() / 2)

	err := json.Unmarshal([]byte(*args.Body), &offer)
	if err != nil {
		core.Log("Error al interpretar el mensaje:", err)
		return core.HandlerResponse{}
	}

	if offer.Offer == "" {
		core.Log("No se recibió el SPD Offer")
		return core.HandlerResponse{}
	}

	offer.ClientID = args.ClientID
	offer.ConnectionID = args.ConnectionID
	dynamoTable := aws.MakeClientTable()
	dynamoTable.PutItem(&offer, 1)

	// Devuelve los ultimos usuarios conectados
	query := aws.DynamoQueryParam{Index: "sk", GreaterThan: "0", ScanIndexForward: true, Limit: 50}
	records, err := dynamoTable.QueryBatch([]aws.DynamoQueryParam{query})
	if err != nil {
		core.Log("Error al obtener las últimas conexiones:", err)
		return core.HandlerResponse{}
	}

	core.Log("Número de conexiones obtenidas::", len(records))
	aws.AssingResponseToClient(args, args.ClientID)
	return args.MakeResponse(records)
}

type rtcConnectionRequest struct {
	ClientAskID  string
	ClientFromID string
	ConnID       string
	Offer        string
	Answer       string
}

func AskRTCConnection(args *core.HandlerArgs) core.HandlerResponse {
	core.Log("Body recibido::", *args.Body)

	request := rtcConnectionRequest{}
	err := json.Unmarshal([]byte(*args.Body), &request)
	if err != nil {
		core.Log("Error al interpretar el mensaje:", err)
		return core.HandlerResponse{}
	}

	if request.ClientAskID == "" || request.Offer == "" {
		core.Log("Error: No se recibió el ClientID o Offer")
		return core.HandlerResponse{}
	}

	request.ClientFromID = args.ClientID
	// Si estamos dentro de una Lambda y enviamos por Api-Gateway
	aws.AssingResponseToClient(args, request.ClientAskID)
	return args.MakeResponse(request)
}

func AnswerRTCConnection(args *core.HandlerArgs) core.HandlerResponse {
	core.Log("Body recibido::", *args.Body)

	request := rtcConnectionRequest{}
	err := json.Unmarshal([]byte(*args.Body), &request)
	if err != nil {
		core.Log("Error al interpretar el mensaje:", err)
		return core.HandlerResponse{}
	}

	if request.ClientFromID == "" || request.Answer == "" {
		core.Log("No se recibió el ClientID o Answer")
		return core.HandlerResponse{}
	}
	aws.AssingResponseToClient(args, request.ClientFromID)
	return args.MakeResponse(request)
}
