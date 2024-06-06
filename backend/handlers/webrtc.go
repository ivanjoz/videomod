package handlers

import (
	"app/aws"
	"app/core"
	"encoding/json"
	"time"
)

type RtcClientOffer struct {
	Offer        string `json:"offer"`
	Name         string `json:"name"`
	ClientID     string `json:"id"`
	ConnectionID string `json:"connID"`
	Updated      string `json:"updated"` // unix time / 2 in base36
}

func MakeClientTable() aws.DynamoTableRecords[RtcClientOffer] {
	return aws.DynamoTableRecords[RtcClientOffer]{
		TableName:      core.Env.DYNAMO_TABLE,
		PK:             "client",
		UseCompression: true,
		GetIndexKeys: func(e RtcClientOffer, idx uint8) string {
			switch idx {
			case 0: // SK (Sort Key)
				return core.Concatn(e.ClientID)
			case 1: // ix1
				return core.Concatn(e.Updated)
			}
			return ""
		},
	}
}

func PostRtcOffer(args *core.HandlerArgs) core.HandlerResponse {
	core.Log("Body recibido::", *args.Body)
	offer := RtcClientOffer{}
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

	core.Print(offer)

	dynamoTable := MakeClientTable()
	dynamoTable.PutItem(&offer, 1)

	// Devuelve los ultimos usuarios conectados
	query := aws.DynamoQueryParam{Index: "sk", GreaterThan: "0", ScanIndexForward: true, Limit: 50}
	records, err := dynamoTable.QueryBatch([]aws.DynamoQueryParam{query})
	if err != nil {
		core.Log("Error al obtener las últimas conexiones:", err)
		return core.HandlerResponse{}
	}

	core.Log("Número de conexiones obtenidas::", len(records))

	return args.MakeResponse(records)
}
