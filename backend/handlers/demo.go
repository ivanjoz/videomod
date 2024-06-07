package handlers

import (
	"app/core"
	"encoding/base64"
)

var DemoFuncs = map[string]func(){
	// Prueba la funcion de base64
	"fn1": func() {
		exampleString := "hola mundo 1234 soy un string 1234dd 1111"
		core.Log("Example string: ", exampleString)
		core.Log("Example string len: ", len(exampleString))

		bodyBytesExample := []byte(exampleString)
		bodyBase64Bytes := make([]byte, base64.StdEncoding.EncodedLen(len(bodyBytesExample)))
		base64.StdEncoding.Encode(bodyBase64Bytes, bodyBytesExample)
		core.Log("Base64 encoded len: ", len(string(bodyBase64Bytes)))
		core.Log("Ratio::", float32(len(string(bodyBase64Bytes)))/float32(len(exampleString)))
	},
	// Prueba la funcion de base632
	"fn2": func() {

		exampleString := "hola mundo 1234 soy un string 1234dd1111111111"
		core.Log("Example string: ", exampleString)
		core.Log("Example string len: ", len(exampleString))
		bodyBytesExample := []byte(exampleString)

		base94Encoded := core.Base94Encode(bodyBytesExample)
		core.Log("Base94 encoded: ", base94Encoded)
		core.Log("Base94 encoded len: ", len(base94Encoded))

		base94Decoded, _ := core.Base94Decode(base94Encoded)

		core.Log("Base94 decoded: ", base94Decoded)

		core.Log("Base94 decoded string: ", string(base94Decoded))
		core.Log("Ratio::", float32(len(base94Encoded))/float32(len(bodyBytesExample)))
	},
}
