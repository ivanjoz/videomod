package handlers

import (
	"app/aws"
	"app/core"
	"encoding/json"
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

	offer := RtcClientOffer{}
	err := json.Unmarshal([]byte(*args.Body), &offer)
	if err != nil {
		core.Log("Error al interpretar el mensaje:", err)
		return core.HandlerResponse{}
	}

	offer.ClientID = args.ClientID

	dynamoTable := MakeClientTable()
	dynamoTable.PutItem(&offer, 1)

	return core.HandlerResponse{}
}
