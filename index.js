const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ port: 8080 });

const PlayersData = {};

wss.on('connection', function connection(ws)
{
    ws.on('message', function message(data)
    {
        const ParsedData = JSON.parse(data);
        if(ParsedData.type == 'playerdata')
        {
            const {PlayerID, position, velocity, rotation, health} = ParsedData.data;
            PlayersData[PlayerID] = {ws, position, velocity, rotation, health};
            BroadcastInformation(ws, PlayerID);
        }
    });
});

function BroadcastInformation(currentClient, CurrentPlayerID)
{
    const CurrentPlayerData = { PlayerId: CurrentPlayerID, ...PlayersData[CurrentPlayerID]};
    const nearbyPlayerIDs = [];
    for(const [PlayerID, playerdata] of Object.entries(PlayersData))
    {
        const distance = CalculateDistance(playerdata.position, PlayersData[CurrentPlayerID].position);

        if(distance <= 1000 && CurrentPlayerID != PlayerID)
        {
            nearbyPlayerIDs.push(PlayerID);
            const { ws, ...DataToSend } = CurrentPlayerData;
            playerdata.ws.send(JSON.stringify({
                type: 'nearbyPlayerData',
                data: DataToSend
            }));
        }
    }

    currentClient.send(JSON.stringify({
        type: 'nearbyPlayers',
        data: nearbyPlayerIDs
    }));
}

function CalculateDistance(position1, position2)
{
    const x = position1.x - position2.x;
    const y = position1.y - position2.y;
    const z = position1.z - position2.z;
    return Math.sqrt(x*x + y*y + z*z);
}