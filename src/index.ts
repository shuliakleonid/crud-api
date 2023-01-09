import {v4 as uuidv4} from 'uuid';
import http from 'http';
import url from 'url';
import * as querystring from "querystring";
import cluster from 'node:cluster'
import os from 'node:os'
import process from 'node:process'

const totalCPUs = os.cpus().length;
const PORT = 5000

const targetUrls = [
  `http://localhost:4001`,
  `http://localhost:4002`,
  `http://localhost:4003`,
  `http://localhost:4004`
];

// Define the User interface
interface User {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
}

// Create a list of users
export const users: User[] = [
  {
    id: uuidv4(),
    username: 'Alice',
    age: 30,
    hobbies: ['running', 'reading']
  },
  {
    id: uuidv4(),
    username: 'Bob',
    age: 25,
    hobbies: ['guitar', 'skateboarding']
  }
];

// Define the Server type
type Server = http.Server
// Define the Request and Response types
type Request = http.IncomingMessage;
type Response = http.ServerResponse;
// Create the HTTP server
if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);
  console.log(`Number of CPUs is ${totalCPUs}`);

  // Fork workers.
  for (let i = 0; i < totalCPUs - 1; i++) {
    cluster.fork();


//   // Create the load balancer
//   const proxy = httpProxyMiddleware(['/api'], {
//     target: targetUrls[0],
//     changeOrigin: true,
//     ws: true,
//     router: function() {
//       // Use the Round-robin algorithm to select the next target URL
//       const targetUrl = targetUrls[i % targetUrls.length];
//       i++;
//       return targetUrl;
//     }
//   });
  }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died. Code : ${code}`);
      console.log("Let's fork another worker!");
      cluster.fork();
    })


} else {
  startApp();
  console.log(`Worker ${process.pid} started`);
}


function startApp() {

// @ts-ignore
const server: Server = http.createServer((req: Request, res: Response) => {
  try {
    // Process the request here
    // Parse the request URL
    // @ts-ignore
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname as string;
    const query = parsedUrl.query;
    res.setHeader('Process_ID', process.pid)

// Handle the different routes
    if (pathname === '/api/users' && req.method === 'GET') {
      // GET api/users - Get all users
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(users));
    } else if (pathname.startsWith('/api/users/') && req.method === 'GET') {
      // GET api/users/:userId - Get a user by ID
      const userId = pathname.split('/')[3];
      console.log('pathname', pathname.split('/'))
      // Validate the user ID
      if (!checkIfValidUUID(userId)) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'Invalid user ID'}));
        return;
      }
      const user = users.find(user => user.id === userId);

      console.log(user, 'user', userId, 'userId')
      // Find the user
      if (!user) {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'User not found'}));
        return;
      }

      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(user));
    } else if (pathname === '/api/users' && req.method === 'POST') {
      // POST api/users - Create a new user
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        const {username, age, hobbies} = JSON.parse(body);

        console.log(username, age, hobbies)
        // Validate the request body
        if (!username || !age || !hobbies) {
          res.writeHead(400, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({message: 'Missing required fields'}));
          return;
        }

// Create the new user
        const newUser: User = {
          id: uuidv4(),
          username,
          age,
          hobbies
        };
        users.push(newUser);

        res.writeHead(201, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(newUser));
      });
    } else if (pathname.startsWith('/api/users/') && req.method === 'PUT') {
// PUT api/users/:userId - Update a user
      const userId = pathname.split('/')[3];

      // Validate the user ID
      if (!checkIfValidUUID(userId)) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'Invalid user ID'}));
        return;
      }

      // Find the user
      const user = users.find(user => user.id === userId);
      if (!user) {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'User not found'}));
        return;
      }

      // Parse the request body
      const body: Uint8Array[] = [];
      req.on('data', chunk => {
        body.push(chunk);
      });
      req.on('end', () => {
        const data = querystring.parse(Buffer.concat(body).toString());
        const {username, age, hobbies} = data;

        // Update the user
        user.username = <string>username || user.username;
        user.age = age ? Number(age) : user.age;
        if (typeof hobbies === "string") {
          user.hobbies = hobbies ? hobbies.split(',') : user.hobbies;
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(user));
      });
    } else {
      // Handle requests to non-existing endpoints
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({message: 'Endpoint not found'}));
    }

  } catch (error) {
    // Handle errors
    res.writeHead(500, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: 'Server error'}));
  }


})

function checkIfValidUUID(str: string): boolean {


  // Regular expression to check if string is a valid UUID
  const regexExp = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
  return regexExp.test(str);

}

server.listen(PORT, () => {
  console.log('Server listening on port ' + PORT)


})
}