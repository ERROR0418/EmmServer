const express = require('express')
var bodyParser = require('body-parser')
const app = express()
const port = 3000
const mongo = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017'
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

mongo.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
  if (err) {
    console.error(err)
    return
  }
    const db = client.db('emmVRC')
    const tokens = db.collection('tokens')
    const messages = db.collection('messages')
    const avatars = db.collection('avatars')
    const blocked = db.collection('blocked')




    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));

    app.use(function (req, res, next) {
        if(req.headers.authorization){
            req.headers.authorization = req.headers.authorization.replace("Bearer ", "");
            tokens.findOne({token: req.headers.authorization}, (err, item)=>{
                if(err || !item) return res.status(401).json({});
                req.userid = item.userid;
                req.username = item.username
                console.log(`${req.username} -- ${req.method} ${req.path}`)
                next();
            })
        }else if(req.path=="/api/authentication/login"){
            console.log(`${req.body.name} -- ${req.method} ${req.path}`)
            next()
        }else{
            res.status(401).json({});
        }
    })


    app.post(`/api/authentication/login`, (req, res)=>{
        blocked.findOne({userid: req.body.username}, (err, item)=>{
            if(item){
                console.log("user is blocked!");
                return res.status(401).json();
            }else{
                var newToken = crypto.randomBytes(32).toString('hex');
                tokens.updateOne({userid: req.body.username, username: req.body.name}, {'$set': {token: newToken}}, {upsert: true}, (err, result)=>{
                    res.json({
                        "token": newToken,
                        "reset": true
                    });
                })
            }
        })
    })

    app.get(`/api/authentication/logout`, (req, res)=>{
        tokens.deleteOne({userid: req.userid});
        res.json({status: "OK"});
    })

    app.get(`/api/avatar`, (req, res)=>{
        avatars.find({userid: req.userid}).toArray((err, items)=>{
            items.forEach(avatar=>{
                delete avatar.userid;
                avatar.avatar_name = Buffer.from(avatar.avatar_name).toString("base64");
                avatar.avatar_author_name = Buffer.from(avatar.avatar_author_name).toString("base64");
            })
            res.json(items);
        })
    })

    app.post(`/api/avatar/search`, (req, res)=>{
        avatars.find({'$or': [{'avatar_author_name': new RegExp(req.body.query, 'i')}, {'avatar_name': new RegExp(req.body.query, 'i')}]}).toArray((err,items)=>{
            items.forEach(avatar=>{
                delete avatar.userid;
                avatar.avatar_name = Buffer.from(avatar.avatar_name).toString("base64");
                avatar.avatar_author_name = Buffer.from(avatar.avatar_author_name).toString("base64");
            })
            res.json(items);
            console.log(JSON.stringify(items, null, 2))
        })
    })

    app.post(`/api/avatar`, (req, res)=>{
        avatars.insertOne({'avatar_name': req.body.avatar_name, 'avatar_id': req.body.avatar_id, 'avatar_asset_url': req.body.avatar_asset_url, 'avatar_thumbnail_image_url': req.body.avatar_thumbnail_image_url, 'avatar_author_id': req.body.avatar_author_id, 'avatar_category': req.body.avatar_category, 'avatar_author_name': req.body.avatar_author_name, 'avatar_public': req.body.avatar_public, 'avatar_supported_platforms': req.body.avatar_supported_platforms, userid: req.userid}, (err, result)=>{
            if(err) return res.json({"status": "ERR"});
            res.json({"status": "OK"});
        })
        
    })

    app.delete(`/api/avatar`, (req, res)=>{
        avatars.deleteOne({userid: req.userid, 'avatar_id': req.body.avatar_id}, (err, result)=>{
            if(err) return res.json({"status": "ERR"});
            res.json({"status": "OK"});
        })
    })

    app.post(`/api/message`, (req, res)=>{
        var messageId = uuidv4();
        messages.insertOne({sentTo: req.body.recipient, 'rest_message_id': messageId, 'rest_message_sender_name': req.username, 'rest_message_sender_id': req.userid, rest_message_body: req.body.body, 'rest_message_created': Math.floor(Date.now() / 1000), 'rest_message_icon': "none"}, (err, result)=>{
            if(err) res.json({status: "ERR"});
            res.json({status: "OK"});
        })
        })

    app.get(`/api/message`, (req, res)=>{
        messages.find({sentTo: req.userid}).toArray((err, items)=>{
            items.forEach(message=>{
                delete message._id;
                delete message.sentTo;
                message.rest_message_sender_name = Buffer.from(message.rest_message_sender_name).toString("base64")
                message.rest_message_body = Buffer.from(message.rest_message_body).toString("base64")
            })
            res.json(items)
        })
    })

    app.patch(`/api/message/:id`, (req, res)=>{
        messages.deleteOne({rest_message_id: req.params.id}, (eer, result)=>{
            if(err) res.json({status: "ERR"});
            res.json({status: "OK"});
        })
    })

    app.listen(port, () => {
    console.log(`emmServer listening at http://0.0.0.0:${port}`)
    })

})
