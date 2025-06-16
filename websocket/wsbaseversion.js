const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({port:8080});

const PlayersData = {};

wss.on('connection', function connection(ws)
{
    ws.on('message', function message(data)
    {
        const ParsedData = JSON.parse(data);
        if(ParsedData.type == 'playerdata')
        {
            const {PlayerID, position, velocity, rotation, health} = ParsedData.data;
            PlayersData[PlayerID] = {position, velocity, rotation, health};
            BroadcastInformation();
        }
    });
});

function BroadcastInformation(){
    const DataToBeUpdated = {
        type: 'allPlayerData',
        data: Object.entries(PlayersData).map(([PlayerID, PLayersData]) => ({PlayerID, ...PLayersData}))
    };
    const DataToSendString = JSON.stringify(DataToBeUpdated);
    wss.clients.forEach((client) => {
        client.send(DataToSendString);
    });
}