import {server} from "./adapters/primary/server"

const port: number = +process.argv[2]

// we create an async main function that can be used to await the 
// async server function. This is primarily due to the fact that 
// some of our application requires async processing and the rules
// for async/await dictate that any async function calls only happen
// from other async functions. 
const main = async ()=> {
    await server(port);
}

main()