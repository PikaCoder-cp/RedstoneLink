const WebSocket = require("ws");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const server = new WebSocket.Server({
    port: PORT
});

const minecraftClients = new Map();
const websiteClients = new Set();

console.log("RedstoneLink server started");
console.log(`Port: ${PORT}`);


// ================================
// NEW CONNECTION
// ================================

server.on("connection", (socket, request) => {

    const url = new URL(
        request.url,
        `http://${request.headers.host}`
    );

    const type = url.searchParams.get("type");


    // ================================
    // MINECRAFT
    // ================================

    if (type === "minecraft") {

        const minecraftId = crypto.randomUUID();

        minecraftClients.set(
            minecraftId,
            socket
        );

        console.log(
            `Minecraft connected: ${minecraftId}`
        );


        // Give Minecraft its ID

        send(socket, {
            type: "connection",
            minecraftId: minecraftId
        });


        // Tell websites

        broadcastToWebsites({
            type: "minecraft_connected",
            minecraftId: minecraftId
        });


        // Minecraft sent a message

        socket.on("message", message => {

            let data;

            try {

                data = JSON.parse(
                    message.toString()
                );

            } catch {

                console.log(
                    "Invalid Minecraft message"
                );

                return;
            }


            console.log(
                "Minecraft:",
                data
            );


            // Send Minecraft message
            // to every connected website

            broadcastToWebsites(data);
        });


        // Minecraft disconnected

        socket.on("close", () => {

            minecraftClients.delete(
                minecraftId
            );


            console.log(
                `Minecraft disconnected: ${minecraftId}`
            );


            broadcastToWebsites({
                type: "minecraft_disconnected",
                minecraftId: minecraftId
            });
        });


        return;
    }


    // ================================
    // WEBSITE
    // ================================

    if (type === "website") {

        websiteClients.add(socket);

        console.log(
            "Website connected"
        );


        // Tell website how many
        // Minecraft clients exist

        send(socket, {
            type: "minecraft_count",
            count: minecraftClients.size
        });


        // Tell website about
        // Minecraft already connected

        for (
            const minecraftId
            of minecraftClients.keys()
        ) {

            send(socket, {
                type: "minecraft_connected",
                minecraftId: minecraftId
            });
        }


        // Website sent a message

        socket.on("message", message => {

            let data;

            try {

                data = JSON.parse(
                    message.toString()
                );

            } catch {

                console.log(
                    "Invalid website message"
                );

                return;
            }


            console.log(
                "Website:",
                data
            );


            // ================================
            // ACTIVATE BLOCK
            // ================================

            if (data.type === "activate") {

                const minecraft =
                    minecraftClients.get(
                        data.minecraftId
                    );


                if (!minecraft) {

                    send(socket, {
                        type: "error",
                        message:
                            "Minecraft is not connected."
                    });

                    return;
                }


                // Send activation
                // to Minecraft

                send(minecraft, {

                    type: "activate",

                    blockId:
                        data.blockId

                });


                console.log(
                    "Activation sent to Minecraft"
                );
            }
        });


        // Website disconnected

        socket.on("close", () => {

            websiteClients.delete(socket);

            console.log(
                "Website disconnected"
            );
        });


        return;
    }


    // ================================
    // UNKNOWN CONNECTION
    // ================================

    socket.close();
});


// ================================
// SEND
// ================================

function send(socket, data) {

    if (
        socket.readyState ===
        WebSocket.OPEN
    ) {

        socket.send(
            JSON.stringify(data)
        );
    }
}


// ================================
// BROADCAST
// ================================

function broadcastToWebsites(data) {

    for (
        const website
        of websiteClients
    ) {

        send(
            website,
            data
        );
    }
}
