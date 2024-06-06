module app

go 1.22.0

require (
	github.com/andybalholm/brotli v1.1.0
	github.com/aws/aws-lambda-go v1.32.0
	github.com/aws/aws-sdk-go-v2 v1.27.1
	github.com/aws/aws-sdk-go-v2/config v1.27.4
	github.com/aws/aws-sdk-go-v2/feature/s3/manager v1.16.6
	github.com/aws/aws-sdk-go-v2/service/s3 v1.51.1
	github.com/fatih/color v1.15.0
	github.com/klauspost/compress v1.17.2
	github.com/martinlindhe/base36 v1.1.1
	github.com/mileusna/useragent v1.3.3
	github.com/rs/cors v1.8.2
)

require (
	github.com/aws/aws-sdk-go-v2/aws/protocol/eventstream v1.6.1 // indirect
	github.com/aws/aws-sdk-go-v2/credentials v1.17.4 // indirect
	github.com/aws/aws-sdk-go-v2/feature/ec2/imds v1.15.2 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.3.8 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.6.8 // indirect
	github.com/aws/aws-sdk-go-v2/internal/ini v1.8.0 // indirect
	github.com/aws/aws-sdk-go-v2/internal/v4a v1.3.2 // indirect
	github.com/aws/aws-sdk-go-v2/service/apigatewaymanagementapi v1.19.9 // indirect
	github.com/aws/aws-sdk-go-v2/service/dynamodbstreams v1.20.8 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding v1.11.2 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/checksum v1.3.2 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/endpoint-discovery v1.9.8 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.11.2 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/s3shared v1.17.2 // indirect
	github.com/aws/aws-sdk-go-v2/service/sso v1.20.1 // indirect
	github.com/aws/aws-sdk-go-v2/service/ssooidc v1.23.1 // indirect
	github.com/aws/aws-sdk-go-v2/service/sts v1.28.1 // indirect
	github.com/aws/smithy-go v1.20.2 // indirect
	github.com/google/go-cmp v0.5.9 // indirect
	github.com/gorilla/websocket v1.5.1 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/kr/text v0.2.0 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.19 // indirect
	github.com/rogpeppe/go-internal v1.9.0 // indirect
	github.com/stretchr/testify v1.8.1 // indirect
	golang.org/x/net v0.17.0 // indirect
	golang.org/x/sys v0.13.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
)

require (
	github.com/DmitriyVTitov/size v1.5.0
	github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue v1.13.19
	github.com/aws/aws-sdk-go-v2/service/dynamodb v1.32.5
	github.com/kr/pretty v0.3.1
	github.com/mitchellh/hashstructure/v2 v2.0.2
	golang.org/x/exp v0.0.0-20231006140011-7918f672742d
	golang.org/x/sync v0.5.0
)

replace github.com/gocql/gocql v1.6.0 => github.com/scylladb/gocql v1.13.0
