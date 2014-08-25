var static = require('node-static');
var file = new(static.Server)();

var path = require('path');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var clientIds = [];

// https://www.npmjs.org/package/dict
var dict = require("dict");



var sessionDict = dict({});


app.use('/agent', express.static('public'));
app.use('/customer', express.static('public'));

app.get('/agent/*', function (req, res) {
	res.sendfile(__dirname + '/public/agent.html');
});

app.get('/customer/*', function(req, res) {
	res.sendfile(__dirname + '/public/customer.html');
});

app.get('/session/:sessionId', function(req, res) {
	var session = {
		id : req.params.sessionId,
		status : "ready"
	};

	res.end(JSON.stringify(session));

});

app.get('*', function (req, res) {
	res.status(404).send('Not found');
	//file.serve(req, res);
  	//res.end("Welcome to the homepage!");
  	//res.sendfile(__dirname + '/public/index.html');
});



server.listen(80);



function findClientsSocket(roomId, namespace) {
    var res = []
    , ns = io.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
        for (var id in ns.connected) {
            if(roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId) ;
                if(index !== -1) {
                    res.push(ns.connected[id]);
                }
            } else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}

io.sockets.on('connection', function (socket){
	//console.log("onconnection:" + JSON.stringify(io.sockets.connected));

	//clientIds.push(socket.id);
	//console.log("Client connected.");
	//socket.broadcast.emit('client updated', {});
	//for (var i=0;i<clientIds.length;i++) {
	//	console.log(clientIds[i]);

	//}

	//var clients = findClientsSocket();
	//console.log(typeof(clients[0]));
	//socket.join('room1');
	//socket.join('room2');
	//console.log(clients[0]);

	socket.on('disconnect', function () {
        console.log("Client disconnect");        
    });
	
	function log(){
		var array = [">>> Message from server: "];
	  	for (var i = 0; i < arguments.length; i++) {
	  		array.push(arguments[i]);
	  	}
	    socket.emit('log', array);
	    console.log(array);
	}

	socket.on('message', function (message) {
		//log('Got message: ', message);
		socket.broadcast.emit('message', message);
	});

	socket.on('offer', function(offer) {
		log('offer:');
		socket.to(offer.sessionId).emit('offer', offer.sessionDescription);
	});

	socket.on('answer', function(answer) {
		log('answer');
		socket.to(answer.sessionId).emit('answer', answer.sessionDescription);
	});

	socket.on('candidate', function(evt) {
		socket.to(evt.sessionId).emit('candidate', evt.candidate);
	});

	socket.on('create or join', function (room) {
        log('create or join', room);



        var clients = io.sockets.adapter.rooms[room]; 
        var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

		log('Room ' + room + ' has ' + numClients + ' client(s)');
		log('Request to create or join room', room);
        

		if (numClients == 0){

			socket.join(room);
			socket.emit('created', room);
		} else if (numClients == 1) {
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room);
		} else { // max two clients
			socket.emit('full', room);
		}
		socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
		socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);

	});

});

Array.prototype.remove = function(value) {
	var idx = this.indexOf(value);
	if ( idx != -1) {
		return this.splice(idx, 1);
	}
	return false;
}


























