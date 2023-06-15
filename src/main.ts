import {server} from "./adapters/primary/server"

const port: number = +process.argv[2]
server(port);