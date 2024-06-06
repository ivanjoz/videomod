package core

import "github.com/gorilla/websocket"

var ConnectionMapper = make(map[string]*websocket.Conn)
