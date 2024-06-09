package aws

import "app/core"

type RtcClientOffer struct {
	Offer        string `json:"offer"`
	Name         string `json:"name"`
	ClientID     string `json:"id"`
	ConnectionID string `json:"connID"`
	Updated      string `json:"updated"` // unix time / 2 in base36
}

func MakeClientTable() DynamoTableRecords[RtcClientOffer] {
	return DynamoTableRecords[RtcClientOffer]{
		TableName:      core.Env.DYNAMO_TABLE,
		PK:             "client" + (core.If(core.Env.IS_PROD, "", "_dev")),
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

func AssingResponseToClient(args *core.HandlerArgs, clientID string) {
	if args.ConnectionID != "" {
		if clientID == args.ClientID {
			args.ResponseConnID = args.ConnectionID
			return
		}
		// Busca el connectionID en la tabla de clientes
		dynamoTable := MakeClientTable()
		rtcClient, err := dynamoTable.GetItem(clientID)
		if err != nil {
			core.Log("Error al obtener info del client:", err)
			return
		}
		core.Log("Respondiendo al client::", rtcClient.ConnectionID)
		args.ResponseConnID = rtcClient.ConnectionID
	} else if args.WebSocketConn != nil {
		args.ResponseConnID = clientID
	}
}
