// const functions = require("./functions")

// module.exports = (io, query) => {
//     //socket io middleware
//     io.use(async (socket, next) => {
//         let token = socket.handshake.auth.token;
//         if (token){
//             const { data } = await functions.getAuth(token)
//             socket.username = data.data.user_name;
//             socket.userId = data.data.id
//             if(data.isSuccessful){
//                 next()
//             }
//         }
//     })

//     //real time chat
//     io.on("connection", (socket) => {
//         socket.join(socket.username)

//         socket.on("get-chat", ({chat_id, userNumber}) => {
//             socket.chat_id = chat_id
//             socket.userNumber = userNumber
//         })

//         // socket.on("seen", () => {
//         //     query(`UPDATE chats SET seen = 0 where id = ${socket.chat_id}`, (err) => {
//         //         if (err) {
//         //             console.log(err.message);
//         //         }
//         //     })
//         // });
//         socket.on("seen", () => {
//             // Make sure the userId is set properly (the user who is marking the chat as seen)
//             query(`UPDATE chats SET seen = ${socket.userId} where id = ${socket.chat_id}`, (err) => {
//                 if (err) {
//                     console.log(err.message);
//                 }
//             });
//         });
        

        // socket.on("message",async ({message, date, to, replyTo}) => {//get new message
        //     const { data } = await functions.getAuth(socket.handshake.auth.token)
        //     //adding userNumber at the beginning of each meassage to be able to know who is the owner of the maessage
        //     if (data.isSuccessful){// Check if Authenticated
        //         if (functions.checkString(message)){
        //             let databaseMessage = socket.userNumber + message // add the owner number of the user to the message
        //             let timeUtc = functions.getCurrenUtcTime(date);
        //             query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = '${message}' where id = ${socket.chat_id}`, (err) => {
        //                 if(err){
        //                     console.log(err.message);
        //                 }
        //             })
        //             query(`Insert Into messages (message, chat_id, reply) values(' ${databaseMessage} ', ${socket.chat_id}, ' ${replyTo} ')`, (err, res) => {
        //                 if(err){
        //                     console.log("Query err", err.message);
        //                 }
        //                 socket.broadcast.to(to).emit("new-message", {message: message, date: timeUtc, from: socket.username, userId:socket.userId, replyTo: replyTo})//send the message to receiver
        //             })
        //         }else {
        //             socket.emit("adminMessage", {message: "You can't Send this type of messages"})
        //         }
        //     }
        // })

//         socket.on("disconnect", (socket) => {
//             console.log(socket);
//         })
//     })

// }

const functions = require("./functions");
const { con } = require('../connections/databaseConnection');

module.exports = (io, query) => {
    // Map to store socket IDs by userId
    const userSocketMap = {};

    // Socket IO middleware for authentication
    io.use(async (socket, next) => {
        let token = socket.handshake.auth.token;
        if (token) {
            const { data } = await functions.getAuth(token);
            socket.username = data.data.user_name;
            socket.userId = data.data.id;
            if (data.isSuccessful) {
                // Store the socket ID by userId when the user connects
                userSocketMap[socket.userId] = socket.id;
                next();
            }
        }
    });

    // Real-time chat
    io.on("connection", (socket) => {
        socket.join(socket.username); // Join a room with the username

        socket.on("get-chat", ({ chat_id, userNumber }) => {
            socket.chat_id = chat_id;
            socket.userNumber = userNumber;
        });

        // Handle marking chat as "seen"
        socket.on("seen", () => {
            // Update the chat as seen by the current user
            query(`UPDATE chats SET seen = ${socket.userId} WHERE id = ${socket.chat_id}`, (err) => {
                if (err) {
                    console.log(err.message);
                }
            });
        });

        // Handle sending a message
        // socket.on("message", async ({ message, date, to, replyTo }) => {
        //     try {
        //       const { data } = await functions.getAuth(socket.handshake.auth.token);
        //       if (data.isSuccessful) {
        //         if (functions.checkString(message)) {
        //           let databaseMessage = `${socket.userNumber}${message}`;
        //           let timeUtc = functions.getCurrenUtcTime(date);
        //           query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = '${message}' where id = ${socket.chat_id}`, (err) => {
        //             if(err){
        //                 console.log(err.message);
        //             }
        //         })
        //         query(`Insert Into messages (message, chat_id, reply) values(' ${databaseMessage} ', ${socket.chat_id}, ' ${replyTo} ')`, (err, res) => {
        //             if(err){
        //                 console.log("Query err", err.message);
        //             }
        //           })
        //           sendMessage(to, message, timeUtc, socket.username, socket.userId, replyTo);
        //         } else {
        //           socket.emit("adminMessage", { message: "You can't send this type of messages" });
        //         }
        //       }
        //     } catch (error) {
        //       console.log("Error handling message:", error.message);
        //     }
        //   });
        //   function sendMessage(to, message, timeUtc, from, userId, replyTo) {
        //     if (to && userSocketMap[to.userId]) {
        //       // Broadcast to the recipient using userSocketMap
        //       socket.broadcast.to(userSocketMap[to.userId]).emit("new-message", {
        //         message: message,
        //         date: timeUtc,
        //         from: from, // Include sender information
        //         userId: userId,
        //         replyTo: replyTo
        //       });
        //       console.log("Message sent to:", to.userId);
        //     } else {
        //       // Handle invalid 'to' or disconnected user
        //       console.log("Error: 'to' is invalid or user is not connected.");
        //     }
        //   }

        // socket.on("message", async ({ message, date, to, replyTo, fileMessage }) => {
        //     try {
        //         const { data } = await functions.getAuth(socket.handshake.auth.token);
        //         if (data.isSuccessful) {
        //             let timeUtc = functions.getCurrenUtcTime(date);
        
        //             // Handle file messages
        //             if (fileMessage) {
        //                 // Store the file paths in the database (or process them as needed)
        //                 let filePaths = message; // Assuming 'message' is an array of file URLs
        //                 let databaseMessage = `${socket.userNumber}${filePaths.join(",")}`; // Store file paths as a comma-separated string
        
        //                 // Store in the database
        //                 query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = '${filePaths.length} files' WHERE id = ${socket.chat_id}`, (err) => {
        //                     if (err) {
        //                         console.log("Error updating chat:", err.message);
        //                     }
        //                 });
        //                 query(`INSERT INTO messages (message, chat_id, reply) VALUES ('${databaseMessage}', ${socket.chat_id}, '${replyTo}')`, (err, res) => {
        //                     if (err) {
        //                         console.log("Query error:", err.message);
        //                     }
        //                 });
        
        //                 // Send message with file paths
        //                 sendMessage(to, filePaths, timeUtc, socket.username, socket.userId, replyTo, true); // Set 'fileMessage' to true
        //             } else {
        //                 // Handle text messages
        //                 if (functions.checkString(message)) {
        //                     let databaseMessage = `${socket.userNumber}${message}`;
        //                     query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = '${message}' WHERE id = ${socket.chat_id}`, (err) => {
        //                         if (err) {
        //                             console.log(err.message);
        //                         }
        //                     });
        //                     query(`INSERT INTO messages (message, chat_id, reply) VALUES ('${databaseMessage}', ${socket.chat_id}, '${replyTo}')`, (err, res) => {
        //                         if (err) {
        //                             console.log("Query error:", err.message);
        //                         }
        //                     });
        //                     sendMessage(to, message, timeUtc, socket.username, socket.userId, replyTo, false); // Set 'fileMessage' to false
        //                 } else {
        //                     socket.emit("adminMessage", { message: "You can't send this type of messages" });
        //                 }
        //             }
        //         }
        //     } catch (error) {
        //         console.log("Error handling message:", error.message);
        //     }
        // });
        
        // function sendMessage(to, message, timeUtc, from, userId, replyTo, fileMessage) {
        //     if (to && userSocketMap[to.userId]) {
        //         // Broadcast to the recipient using userSocketMap
        //         socket.broadcast.to(userSocketMap[to.userId]).emit("new-message", {
        //             message: message,
        //             fileMessage: fileMessage,  // Send fileMessage flag
        //             date: timeUtc,
        //             from: from,  // Include sender information
        //             userId: userId,
        //             replyTo: replyTo
        //         });
        //         console.log("Message sent to:", to.userId);
        //     } else {
        //         console.log("Error: 'to' is invalid or user is not connected.");
        //     }
        // }

//         socket.on("message", async ({ message, date, to, replyTo, fileMessage }) => {
//     try {
//         const { data } = await functions.getAuth(socket.handshake.auth.token);
//         if (data.isSuccessful) {
//             let timeUtc = functions.getCurrenUtcTime(date);

//             // Handle file messages
//             if (fileMessage) {
//                 // Assuming 'message' is an array of file URLs
//                 let filePaths = message; // This should be an array of file URLs
//                 let databaseMessage = `\n${socket.userNumber}${filePaths.join(",")}\n`; // Concatenate without extra spaces

//                 // Store the file paths in the database (and update last_message in the chat)
//                 query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = '${filePaths.length} files' WHERE id = ${socket.chat_id}`, (err) => {
//                     if (err) {
//                         console.log("Error updating chat:", err.message);
//                     }
//                 });

//                 // Insert the file paths into the messages table, without extra space
//                 query(`INSERT INTO messages (message, chat_id, reply) VALUES ('${databaseMessage}', ${socket.chat_id}, '${replyTo}')`, (err, res) => {
//                     if (err) {
//                         console.log("Query error:", err.message);
//                     }
//                 });

//                 // Send the message with file paths
//                 sendMessage(to, filePaths, timeUtc, socket.username, socket.userId, replyTo, true); // Set 'fileMessage' to true
//             } else {
//                 // Handle text messages
//                 if (functions.checkString(message)) {
//                     let databaseMessage = `${socket.userNumber}${message.trim()}`; // Use trim() to avoid leading or trailing spaces
//                     query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = '${message}' WHERE id = ${socket.chat_id}`, (err) => {
//                         if (err) {
//                             console.log(err.message);
//                         }
//                     });

//                     // Insert the message into the database
//                     query(`INSERT INTO messages (message, chat_id, reply) VALUES ('${databaseMessage}', ${socket.chat_id}, '${replyTo}')`, (err, res) => {
//                         if (err) {
//                             console.log("Query error:", err.message);
//                         }
//                     });

//                     sendMessage(to, message, timeUtc, socket.username, socket.userId, replyTo, false); // Set 'fileMessage' to false
//                 } else {
//                     socket.emit("adminMessage", { message: "You can't send this type of messages" });
//                 }
//             }
//         }
//     } catch (error) {
//         console.log("Error handling message:", error.message);
//     }
// });

// function sendMessage(to, message, timeUtc, from, userId, replyTo, fileMessage) {
//     if (to && userSocketMap[to.userId]) {
//         // Broadcast to the recipient using userSocketMap
//         socket.broadcast.to(userSocketMap[to.userId]).emit("new-message", {
//             message: message, // Send the message (either file paths or text)
//             fileMessage: fileMessage, // Send fileMessage flag
//             date: timeUtc,
//             from: from, // Include sender information
//             userId: userId,
//             replyTo: replyTo
//         });
//         console.log("Message sent to:", to.userId);
//     } else {
//         console.log("Error: 'to' is invalid or user is not connected.");
//     }
// }

// socket.on("message", async ({ message, date, to, replyTo, fileMessage }) => {
//     try {
//         const { data } = await functions.getAuth(socket.handshake.auth.token);
//         if (data.isSuccessful) {
//             let timeUtc = functions.getCurrenUtcTime(date);

//             // Handle file messages
//             if (fileMessage) {
//                 // Assuming 'message' is an array of file URLs
//                 let filePaths = message; // This should be an array of file URLs
//                 let databaseMessage = `\n${socket.userNumber}${filePaths.join(",")}`; // Concatenate with newlines before and after

//                 // Store the file paths in the database (and update last_message in the chat)
//                 query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = '${filePaths.length} files' WHERE id = ${socket.chat_id}`, (err) => {
//                     if (err) {
//                         console.log("Error updating chat:", err.message);
//                     }
//                 });

//                 // Insert the file paths into the messages table
//                 query(`INSERT INTO messages (message, chat_id, reply) VALUES ('${databaseMessage}', ${socket.chat_id}, '${replyTo}')`, (err, res) => {
//                     if (err) {
//                         console.log("Query error:", err.message);
//                     }
//                 });

//                 // Send the message with file paths
//                 sendMessage(to, filePaths, timeUtc, socket.username, socket.userId, replyTo, true); // Set 'fileMessage' to true
//             } else {
//                 // Handle text messages
//                 if (functions.checkString(message)) {
//                     let databaseMessage = `${socket.userNumber}${message}`; // Keep the message with spaces intact

//                     // Check if the message is blank (i.e., just spaces or newlines)
//                     if (message.trim() === '') {
//                         databaseMessage = `\n${socket.userNumber}\n`; // Store a blank row in the database
//                     }

//                     // Update the chat with the message
//                     query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = '${message}' WHERE id = ${socket.chat_id}`, (err) => {
//                         if (err) {
//                             console.log("Error updating chat:", err.message);
//                         }
//                     });

//                     // Insert the message into the database, keeping spaces and blank rows intact
//                     query(`INSERT INTO messages (message, chat_id, reply) VALUES ('${databaseMessage}', ${socket.chat_id}, '${replyTo}')`, (err, res) => {
//                         if (err) {
//                             console.log("Query error:", err.message);
//                         }
//                     });

//                     // Send the message
//                     sendMessage(to, message, timeUtc, socket.username, socket.userId, replyTo, false); // Set 'fileMessage' to false
//                 } else {
//                     socket.emit("adminMessage", { message: "You can't send this type of messages" });
//                 }
//             }
//         }
//     } catch (error) {
//         console.log("Error handling message:", error.message);
//     }
// });

// function sendMessage(to, message, timeUtc, from, userId, replyTo, fileMessage) {
//     if (to && userSocketMap[to.userId]) {
//         // Broadcast to the recipient using userSocketMap
//         socket.broadcast.to(userSocketMap[to.userId]).emit("new-message", {
//             message: message, // Send the message (either file paths or text)
//             fileMessage: fileMessage, // Send fileMessage flag
//             date: timeUtc,
//             from: from, // Include sender information
//             userId: userId,
//             replyTo: replyTo
//         });
//         console.log("Message sent to:", to.userId);
//     } else {
//         console.log("Error: 'to' is invalid or user is not connected.");
//     }
// }

socket.on("message", async ({ message, date, to, replyTo, fileMessage }) => {
    try {
        const { data } = await functions.getAuth(socket.handshake.auth.token);
        if (data.isSuccessful) {
            let timeUtc = functions.getCurrenUtcTime(date);

            // Handle file messages
            if (fileMessage) {
                // Assuming 'message' is an array of file URLs
                let filePaths = message; // This should be an array of file URLs
                let databaseMessage = `\n${socket.userNumber}${filePaths.join(",")}\n`; // Add a blank row before and after

                // Store the file paths in the database (and update last_message in the chat)
                query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = '${filePaths.length} files' WHERE id = ${socket.chat_id}`, (err) => {
                    if (err) {
                        console.log("Error updating chat:", err.message);
                    }
                });

                // Insert the file paths into the messages table
                query(`INSERT INTO messages (message, chat_id, reply) VALUES ('${databaseMessage}', ${socket.chat_id}, '${replyTo}')`, (err, res) => {
                    if (err) {
                        console.log("Query error:", err.message);
                    }
                });

                // Send the message with file paths
                sendMessage(to, filePaths, timeUtc, socket.username, socket.userId, replyTo, true); // Set 'fileMessage' to true
            } else {
                // Handle text messages
                if (functions.checkString(message)) {
                    // Start with a blank row at the top
                    let databaseMessage = `\n${socket.userNumber}\n`;  // Blank row at the top

                    // Check if the message is blank (i.e., just spaces or newlines)
                    if (message.trim() !== '') {
                        databaseMessage += message; // Append the actual message if it's not empty
                    }

                    // Update the chat with the message
                    query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = '${message}' WHERE id = ${socket.chat_id}`, (err) => {
                        if (err) {
                            console.log("Error updating chat:", err.message);
                        }
                    });

                    // Insert the message into the database, keeping the blank row intact
                    query(`INSERT INTO messages (message, chat_id, reply) VALUES ('${databaseMessage}', ${socket.chat_id}, '${replyTo}')`, (err, res) => {
                        if (err) {
                            console.log("Query error:", err.message);
                        }
                    });

                    // Send the message
                    sendMessage(to, message, timeUtc, socket.username, socket.userId, replyTo, false); // Set 'fileMessage' to false
                } else {
                    socket.emit("adminMessage", { message: "You can't send this type of messages" });
                }
            }
        }
    } catch (error) {
        console.log("Error handling message:", error.message);
    }
});

function sendMessage(to, message, timeUtc, from, userId, replyTo, fileMessage) {
    if (to && userSocketMap[to.userId]) {
        // Broadcast to the recipient using userSocketMap
        socket.broadcast.to(userSocketMap[to.userId]).emit("new-message", {
            message: message, // Send the message (either file paths or text)
            fileMessage: fileMessage, // Send fileMessage flag
            date: timeUtc,
            from: from, // Include sender information
            userId: userId,
            replyTo: replyTo
        });
        console.log("Message sent to:", to.userId);
    } else {
        console.log("Error: 'to' is invalid or user is not connected.");
    }
}



        
// Frontend: Listen for 'new-file-message' event
// socket.on('new-file-message', (data) => {
//   // Extract the data from the message
//   const { chatId, message, fileUrl, fileName, fileSize, userId } = data;

//   // Check if the chat is active and matches the current chatId
//   if (chatId === socket.chat_id) {
//       // Find the messages container to insert the new file message
//       const messagesContainer = $(".messages-container");

//       // Create a new div element for the file message
//       const fileMessageContainer = document.createElement("div");
//       fileMessageContainer.className = "singleMessageContainer";

//       // Create a div for the message
//       const messageDiv = document.createElement("div");
//       messageDiv.className = "file-message";

//       // Add file link to the message
//       const fileLink = document.createElement("a");
//       fileLink.href = fileUrl;
//       fileLink.target = "_blank";
//       fileLink.textContent = `File: ${fileName} (${fileSize} bytes)`;

//       // Append the file link to the message div
//       messageDiv.appendChild(fileLink);

//       // Append the message div to the file message container
//       fileMessageContainer.appendChild(messageDiv);

//       // Add the file message to the chat
//       messagesContainer.append(fileMessageContainer);

//       // Optionally, scroll the chat container to the bottom
//       autoScroll();

//       // Optionally, handle any other UI updates
//   }
// });

// socket.on("send-file", async ({ fileBase64, fileName, fileSize, chatId, date, replyTo }) => {
//   try {
//       // Decode the Base64 string back to binary data
//       const fileBuffer = Buffer.from(fileBase64, 'base64');

//       // Generate a path to store the file (e.g., in a directory)
//       const filePath = `./uploads/${chatId}/${fileName}`;
//       const fs = require('fs');
//       const path = require('path');
      
//       // Ensure the directory exists
//       const dir = path.dirname(filePath);
//       if (!fs.existsSync(dir)){
//           fs.mkdirSync(dir, { recursive: true });
//       }

//       // Write the file to disk
//       fs.writeFileSync(filePath, fileBuffer);

//       // Generate the file URL
//       const fileUrl = `http://localhost:3000/files/${chatId}/${fileName}`;

//       // Format the message similar to text messages (e.g., "User1 File: http://...")
//       let databaseMessage = `${socket.userNumber}${fileUrl}`;

//       // Database query to insert the file message into the 'messages' table
//       const queryText = 'INSERT INTO messages (chat_id, message, file_data, file_name, reply) VALUES (?, ?, ?, ?, ?)';
      
//       // Save file metadata in the database
//       con.query(queryText, [chatId, databaseMessage, fileBuffer, fileName, replyTo], (err, result) => {
//           if (err) {
//               console.error('Error inserting file into database:', err.message);
//               return;
//           }

//           console.log('File data stored in database successfully', result);

//           // Emit a notification to all users in the chat
//           io.emit('new-file-message', {
//               chatId,
//               fileUrl,
//               fileName,
//               fileSize,
//               userId: socket.userId,  // Use the sender's user ID
//               replyTo
//           });

//           // Update the chat with the latest message
//           const timeUtc = functions.getCurrenUtcTime(date); // Get the UTC time for the message
//           query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = 'File: ${fileUrl}' where id = ${chatId}`, (err) => {
//               if (err) {
//                   console.log('Error updating chat:', err.message);
//               }
//           });

//           // Send the file message to the recipient(s)
//           sendFileMessage({ chatId, fileUrl, fileName, fileSize, userId: socket.userId, replyTo, timeUtc });
//       });
//   } catch (error) {
//       console.log("Error handling file upload:", error.message);
//   }
// });

// socket.on("send-file", async ({ fileBase64, fileName, fileSize, chatId, date, replyTo }) => {
//   try {
//       const fileBuffer = Buffer.from(fileBase64, 'base64');
//       const filePath = `./uploads/${chatId}/${fileName}`;
//       const fs = require('fs');
//       const path = require('path');
//       const dir = path.dirname(filePath);
//       if (!fs.existsSync(dir)){
//           fs.mkdirSync(dir, { recursive: true });
//       }
//       fs.writeFileSync(filePath, fileBuffer);
//       const fileUrl = `http://localhost:3000/files/${chatId}/${fileName}`;
//       let databaseMessage = ` ${socket.userNumber}${fileUrl}`;
//       const queryText = 'INSERT INTO messages (chat_id, message, file_data, file_name, reply) VALUES (?, ?, ?, ?, ?)';
//       con.query(queryText, [chatId, databaseMessage, fileBuffer, fileName, replyTo], (err, result) => {
//           if (err) {
//               console.error('Error inserting file into database:', err.message);
//               return;
//           }
//           console.log('File data stored in database successfully', result);
//           // Emit a notification to all users in the chat
//         //   io.emit('new-file-message', {
//         //       chatId,
//         //       fileUrl,
//         //       fileName,
//         //       fileSize,
//         //       userId: socket.userId,  // Use the sender's user ID
//         //       replyTo
//         //   });
//           const timeUtc = functions.getCurrenUtcTime(date); // Get the UTC time for the message
//           query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = 'File: ${fileUrl}' where id = ${chatId}`, (err) => {
//               if (err) {
//                   console.log('Error updating chat:', err.message);
//               }
//           });
//           io.emit('new-file-message', {
//             chatId,
//             fileUrl,
//             fileName,
//             fileSize,
//             userId: socket.userId, // sender's ID
//             replyTo,
//             messageType: 'file',  // Indicate it's a file message
//             senderId: socket.userId, // Store senderId for alignment purpose
//             timestamp: date // Ensure this is the correct timestamp
//         });
        
        
        
//           // Send the file message to the recipient(s)
//           sendFileMessage({ chatId, fileUrl, fileName, fileSize, userId: socket.userId, replyTo, timeUtc });
//       });
//   } catch (error) {
//       console.log("Error handling file upload:", error.message);
//   }
// });


// Function to send the file message via socket to the recipient
// function sendFileMessage({ chatId, fileUrl, fileName, fileSize, userId, replyTo, timeUtc }) {
//   const to = getRecipientForChat(chatId); // Get the recipient for the chat (you'll need to implement this function)

//   if (to && userSocketMap[to.userId]) {
//       socket.broadcast.to(userSocketMap[to.userId]).emit("new-file-message", {
//           fileUrl,
//           fileName,
//           fileSize,
//           date: timeUtc,
//           from: socket.username,
//           userId,
//           replyTo
//       });
//       console.log("File message sent to:", to.userId);
//   } else {
//       console.log("Error: 'to' is invalid or user is not connected.");
//   }
// }

// function sendFileMessage({ chatId, fileUrl, fileName, fileSize, userId, replyTo, timeUtc }) {
//     const to = getRecipientForChat(chatId); // Get the recipient for the chat (you'll need to implement this function)
  
//     if (to && userSocketMap[to.userId]) {
//         socket.broadcast.to(userSocketMap[to.userId]).emit("new-file-message", {
//             fileUrl,
//             fileName,
//             fileSize,
//             timestamp: timeUtc,  // Changed 'date' to 'timestamp' for consistency
//             from: socket.username,
//             userId,
//             replyTo
//         });
//         console.log("File message sent to:", to.userId);
//     } else {
//         console.log("Error: 'to' is invalid or user is not connected.");
//     }
//   }
  
// socket.on("send-file", async ({ fileBase64, fileName, fileSize, chatId, date, replyTo, to }) => {
//     try {
//         const fileBuffer = Buffer.from(fileBase64, 'base64');
//         const filePath = `./uploads/${chatId}/${fileName}`;
//         const fs = require('fs');
//         const path = require('path');
//         const dir = path.dirname(filePath);
//         if (!fs.existsSync(dir)){
//             fs.mkdirSync(dir, { recursive: true });
//         }
//         fs.writeFileSync(filePath, fileBuffer);
//         const fileUrl = `http://localhost:3000/files/${chatId}/${fileName}`;
//         let databaseMessage = ` ${socket.userNumber}${fileUrl}`;
//         const queryText = 'INSERT INTO messages (chat_id, message, file_data, file_name, reply) VALUES (?, ?, ?, ?, ?)';
//         con.query(queryText, [chatId, databaseMessage, fileBuffer, fileName, replyTo], (err, result) => {
//             if (err) {
//                 console.error('Error inserting file into database:', err.message);
//                 return;
//             }
//             console.log('File data stored in database successfully', result);
//             const timeUtc = functions.getCurrenUtcTime(date); // Get the UTC time for the message
//             query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = 'File: ${fileUrl}' where id = ${chatId}`, (err) => {
//                 if (err) {
//                     console.log('Error updating chat:', err.message);
//                 }
//             });
  
//             // Now, you can send the file message directly to the recipient using the 'to' field
//             sendFileMessage({ fileUrl, fileName, fileSize, userId: socket.userId, replyTo, timeUtc, to });
//                       io.emit('new-file-message', {
//                         fileUrl,
//                         fileName,
//                         fileSize,
//                         timestamp: timeUtc,  // Changed 'date' to 'timestamp' for consistency
//                         from: socket.username,
//                         userId: socket.userId,
//                         replyTo
//           });
//         });
//     } catch (error) {
//         console.log("Error handling file upload:", error.message);
//     }
//   });

// socket.on("send-file", async ({ fileBase64, fileName, fileSize, chatId, date, replyTo, to }) => {
//     try {
//         // Check if chatId is available
//         if (!chatId) {
//             console.log("Error: Missing chatId");
//             return;
//         }

//         // If there's no recipient ('to'), return early
//         if (!to || !to.userId) {
//             console.log("Error: Invalid recipient (to is missing or malformed).");
//             return;
//         }

//         const fileBuffer = Buffer.from(fileBase64, 'base64');
//         const filePath = `./uploads/${chatId}/${fileName}`;
//         const fs = require('fs');
//         const path = require('path');
//         const dir = path.dirname(filePath);
//         if (!fs.existsSync(dir)){
//             fs.mkdirSync(dir, { recursive: true });
//         }
//         fs.writeFileSync(filePath, fileBuffer);

//         const fileUrl = `http://localhost:3000/files/${chatId}/${fileName}`;
//         const timeUtc = functions.getCurrenUtcTime(date); // Use the provided date for the timestamp

//         let databaseMessage = ` ${socket.userNumber}${fileUrl}`;
//         const queryText = 'INSERT INTO messages (chat_id, message, file_data, file_name, reply) VALUES (?, ?, ?, ?, ?)';
//         con.query(queryText, [chatId, databaseMessage, fileBuffer, fileName, replyTo], (err, result) => {
//             if (err) {
//                 console.error('Error inserting file into database:', err.message);
//                 return;
//             }
//             console.log('File data stored in database successfully', result);

//             // Update the chat with the latest message and timestamp
//             query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = 'File: ${fileUrl}' WHERE id = ${chatId}`, (err) => {
//                 if (err) {
//                     console.log('Error updating chat:', err.message);
//                 }
//             });

//             // Send the file message directly to the recipient using the 'to' field
//             sendFileMessage({ fileUrl, fileName, fileSize, userId: socket.userId, replyTo, timeUtc, to });

//             // Emit the message to all listeners (including the sender) for the UI
//             io.emit('new-file-message', {
//                 fileUrl,
//                 fileName,
//                 fileSize,
//                 timestamp: timeUtc,  // Use the UTC timestamp for the message
//                 from: socket.username,
//                 userId: socket.userId,
//                 replyTo,
//                 messageType: 3 // 3 indicates this is a file message
//             });
//         });
//     } catch (error) {
//         console.log("Error handling file upload:", error.message);
//     }
// });

  
  function sendFileMessage({ fileUrl, fileName, fileSize, userId, replyTo, timeUtc, to }) {
      if (to && userSocketMap[to.userId]) {
          // Send file message directly to the recipient using 'to'
          socket.broadcast.to(userSocketMap[to.userId]).emit("new-file-message", {
              fileUrl,
              fileName,
              fileSize,
              timestamp: timeUtc,  // Changed 'date' to 'timestamp' for consistency
              from: socket.username,
              userId,
              replyTo
          });
          console.log("File message sent to:", to.userId);
      } else {
          console.log("Error: 'to' is invalid or user is not connected.");
      }
  }
  
// socket.on("send-file", async ({ fileBase64, fileName, fileSize, chatId, date, replyTo }) => {
//   try {
//       const fileBuffer = Buffer.from(fileBase64, 'base64');
//       const filePath = `./uploads/${chatId}/${fileName}`;
//       const fs = require('fs');
//       const path = require('path');
//       const dir = path.dirname(filePath);
//       if (!fs.existsSync(dir)){
//           fs.mkdirSync(dir, { recursive: true });
//       }
//       fs.writeFileSync(filePath, fileBuffer);
//       const fileUrl = `http://localhost:3000/files/${chatId}/${fileName}`;
//       let databaseMessage = `${socket.userNumber}${fileUrl}`;  // Prepend user number and file message
//       const queryText = 'INSERT INTO messages (chat_id, message, file_data, file_name, reply) VALUES (?, ?, ?, ?, ?)';
//       con.query(queryText, [chatId, databaseMessage, fileBuffer, fileName, replyTo], (err, result) => {
//           if (err) {
//               console.error('Error inserting file into database:', err.message);
//               return;
//           }
//           console.log('File data stored in database successfully', result);
//           // io.emit('new-file-message', {
//           //     chatId,
//           //     fileUrl,
//           //     fileName,
//           //     fileSize,
//           //     userId: socket.userId,
//           //     replyTo
//           // });
//           // Update the chat with the latest message
//           const timeUtc = functions.getCurrenUtcTime(date); // Get the UTC time for the message
//           query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = 'File: ${fileUrl}' where id = ${chatId}`, (err) => {
//               if (err) {
//                   console.log('Error updating chat:', err.message);
//               }
//           });

//           // Send the file message to the recipient(s)
//           sendFileMessage({ chatId, fileUrl, fileName, fileSize, userId: socket.userId, replyTo, timeUtc });
//       });
//   } catch (error) {
//       console.log("Error handling file upload:", error.message);
//   }
// });

// function sendFileMessage({ chatId, fileUrl, fileName, fileSize, userId, replyTo, timeUtc }) {
//   const to = getRecipientForChat(chatId); // Get the recipient for the chat (you'll need to implement this function)

//   if (to && userSocketMap[to.userId]) {
//       socket.broadcast.to(userSocketMap[to.userId]).emit("new-file-message", {
//           fileUrl,
//           fileName,
//           fileSize,
//           date: timeUtc,
//           from: socket.username,
//           userId,
//           replyTo
//       });
//       console.log("File message sent to:", to.userId);
//   } else {
//       console.log("Error: 'to' is invalid or user is not connected.");
//   }
// }
// comment out previous codee and add the following code on monday
// socket.on("send-file", async ({ fileBase64, fileName, fileSize, chatId, date, replyTo }) => {
//   try {
//       const fileBuffer = Buffer.from(fileBase64, 'base64');
//       const filePath = `./uploads/${chatId}/${fileName}`;
//       const fs = require('fs');
//       const path = require('path');
//       const dir = path.dirname(filePath);
//       if (!fs.existsSync(dir)){
//           fs.mkdirSync(dir, { recursive: true });
//       }
//       fs.writeFileSync(filePath, fileBuffer);
//       const fileUrl = `http://localhost:3000/files/${chatId}/${fileName}`;
//       let databaseMessage = `${socket.userNumber}${fileUrl}`;  // Prepend user number and file message
//       const queryText = 'INSERT INTO messages (chat_id, message, file_data, file_name, reply) VALUES (?, ?, ?, ?, ?)';
//       con.query(queryText, [chatId, databaseMessage, fileBuffer, fileName, replyTo], (err, result) => {
//           if (err) {
//               console.error('Error inserting file into database:', err.message);
//               return;
//           }
//           console.log('File data stored in database successfully', result);

//           const timeUtc = functions.getCurrenUtcTime(date); // Get the UTC time for the message
//           query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = 'File: ${fileUrl}' where id = ${chatId}`, (err) => {
//               if (err) {
//                   console.log('Error updating chat:', err.message);
//               }
//           });

//           // Send the file message to the recipient(s)
//           sendFileMessage({ chatId, fileUrl, fileName, fileSize, userId: socket.userId, replyTo, timeUtc });
//       });
//   } catch (error) {
//       console.log("Error handling file upload:", error.message);
//   }
// });

// function sendFileMessage({ chatId, fileUrl, fileName, fileSize, userId, replyTo, timeUtc }) {
//   const to = getRecipientForChat(chatId); // Get the recipient for the chat (you'll need to implement this function)
//   if (to && userSocketMap[to.userId]) {
//       socket.broadcast.to(userSocketMap[to.userId]).emit("new-file-message", {
//           fileUrl,
//           fileName,
//           fileSize,
//           date: timeUtc,
//           from: socket.username,
//           userId,
//           replyTo
//       });
//       console.log("File message sent to:", to.userId);
//   } else {
//       console.log("Error: 'to' is invalid or user is not connected.");
//   }
// }



//           // Handle sending file messages
// // Backend: Handling the socket event for file upload
// socket.on("send-file", async ({ fileBase64, fileName, fileSize, chatId, date, replyTo }) => {
//   try {
//       console.log("File upload started for chatId:", chatId, "fileName:", fileName);

//       // Process file and insert to database
//       const fileBuffer = Buffer.from(fileBase64, 'base64');
//       const filePath = `./uploads/${chatId}/${fileName}`;
//       const fs = require('fs');
//       const path = require('path');
      
//       const dir = path.dirname(filePath);
//       if (!fs.existsSync(dir)){
//           fs.mkdirSync(dir, { recursive: true });
//       }
      
//       fs.writeFileSync(filePath, fileBuffer);

//       const fileUrl = `http://localhost:3000/files/${chatId}/${fileName}`;
//       let databaseMessage = `${socket.userNumber}${fileUrl}`;

//       // Check if the file already exists in the database before inserting
//       const checkQuery = 'SELECT COUNT(*) AS count FROM messages WHERE chat_id = ? AND file_name = ?';
//       con.query(checkQuery, [chatId, fileName], (err, results) => {
//           if (err) {
//               console.error('Error checking for existing file:', err.message);
//               return;
//           }

//           if (results[0].count > 0) {
//               console.log('File already exists in the database. Skipping insert.');
//               return;
//           }

//           const queryText = 'INSERT INTO messages (chat_id, message, file_data, file_name, reply) VALUES (?, ?, ?, ?, ?)';
//           con.query(queryText, [chatId, databaseMessage, fileBuffer, fileName, replyTo], (err, result) => {
//               if (err) {
//                   console.error('Error inserting file into database:', err.message);
//                   return;
//               }

//               console.log('File data stored in database successfully', result);
//               io.emit('new-file-message', {
//                   chatId,
//                   fileUrl,
//                   fileName,
//                   fileSize,
//                   userId: socket.userId,  // Use actual user ID
//                   replyTo
//               });

//               // Update the chat with the latest message
//               const timeUtc = functions.getCurrenUtcTime(date); // Get the UTC time for the message
//               query(`UPDATE chats SET updated_at = '${timeUtc}', seen = ${socket.userId}, last_message = 'File: ${fileUrl}' where id = ${chatId}`, (err) => {
//                   if (err) {
//                       console.log('Error updating chat:', err.message);
//                   }
//               });

//               // Send the file message to the recipient(s)
//               sendFileMessage({ chatId, fileUrl, fileName, fileSize, userId: socket.userId, replyTo, timeUtc });
//           });
//       });
//   } catch (error) {
//       console.log("Error handling file upload:", error.message);
//   }
// });


          

// // Function to send a file message via socket
// function sendFileMessage(to, fileUrl, fileData, timeUtc, from, userId, replyTo) {
//   if (to && userSocketMap[to.userId]) {
//       socket.broadcast.to(userSocketMap[to.userId]).emit("new-file-message", {
//           fileUrl: fileUrl,  // Send the file URL
//           fileData: fileData,  // Send the file data (can be base64 encoded)
//           date: timeUtc,
//           from: from,
//           userId: userId,
//           replyTo: replyTo,
//       });
//       console.log("File message sent to:", to.userId);
//   } else {
//       console.log("Error: 'to' is invalid or user is not connected.");
//   }
// }

                  // Handle sending a file message (file URL)
                  socket.on("file-message", async ({ fileUrls, date, to, replyTo }) => {
                    try {
                        const { data } = await functions.getAuth(socket.handshake.auth.token);
                        if (data.isSuccessful) {
                            let timeUtc = functions.getCurrenUtcTime(date);
                            
                            // Broadcast the file URL to the recipient (if they are connected)
                            fileUrls.forEach(fileUrl => {
                                let databaseMessage = `${socket.userNumber}${fileUrl}`;
                                query(`INSERT INTO messages (message, chat_id, reply) VALUES ('${databaseMessage}', ${socket.chat_id}, '${replyTo}')`, (err, res) => {
                                    if (err) {
                                        console.log("Error inserting file message:", err.message);
                                    }
                                });
                                sendFileMessage(to, fileUrl, timeUtc, socket.username, socket.userId, replyTo);
                            });
                        }
                    } catch (error) {
                        console.log("Error handling file message:", error.message);
                    }
                });
                
                // Function to send file message
                function sendFileMessage(to, fileUrl, timeUtc, from, userId, replyTo) {
                    if (to && userSocketMap[to.userId]) {
                        // Broadcast to the recipient
                        socket.broadcast.to(userSocketMap[to.userId]).emit("new-file-message", {
                            fileUrl: fileUrl,  // Send file URL
                            date: timeUtc,
                            from: from,
                            userId: userId,
                            replyTo: replyTo
                        });
                        console.log("File message sent to:", to.userId);
                    } else {
                        // Handle invalid 'to' or disconnected user
                        console.log("Error: 'to' is invalid or user is not connected.");
                    }
                }
                
        // Handle disconnect event
        socket.on("disconnect", () => {
            // Remove the user from the userSocketMap when they disconnect
            delete userSocketMap[socket.userId];
            console.log(`${socket.username} disconnected.`);
        });
    });
};
