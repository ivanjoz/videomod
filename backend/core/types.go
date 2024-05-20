package core

import (
	"encoding/json"
	"strconv"
)

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
