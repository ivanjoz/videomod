package handlers

import "app/core"

var ModuleHandlers = core.AppRouterType{
	"PostRtcOffer":        PostRtcOffer,
	"AskRTCConnection":    AskRTCConnection,
	"AnswerRTCConnection": AnswerRTCConnection,
}
