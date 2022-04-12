import {Component, OnInit} from '@angular/core';
import {Client, IFrame, IMessage} from '@stomp/stompjs'
import * as SockJS from 'sockjs-client'
import  { environment } from "../environments/environment";
import {Message} from "./models/message";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  private client! : Client;
  connected : boolean = false
  messages : Message[] = []
  isWriting : string = ""
  message : Message = {
    text : "",
    user: "",
    color: "",
    type: ""
  };
  constructor() {
  }

  ngOnInit(): void {
    this.client = new Client();
    this.client.webSocketFactory = () => new SockJS(environment.webSocketUrl)

    this.client.onConnect = (frame : IFrame) => {
      this.connected = true


      this.client.subscribe("/chat/message", (_msg: IMessage) => {
        const _message: Message = JSON.parse(_msg.body) as Message
        _message.date = new Date(_message.date!)

        if(!this.message.color && this.message.type === "NEW_USER" && this.message.user === _message.user){
          this.message.color = _message.color
        }

        this.messages.push(_message)
      })

      this.client.subscribe("/chat/writing", (_msg: IMessage) => {
        if(_msg.body.includes(this.message.user)) return;
        this.isWriting = _msg.body
        setTimeout(() => {this.isWriting = ""}, 3000)
      })

      this.message.type = "NEW_USER"
      this.client.publish({
        destination: "/app/message",
        body: JSON.stringify(this.message)
      });

    }

    this.client.onDisconnect = (frame : IFrame) => {
      console.log(`Disconnected : ${frame}`)
      this.connected = false
    }
  }

  connect(): void {
    this.client.activate();
  }

  disconnect(): void {
    this.client.deactivate();
  }

  sendMessage(): void {
    this.message.type = "MESSAGE"
      this.client.publish({
        destination: "/app/message",
        body: JSON.stringify(this.message)
      });
    this.message.text = ""
  }

  writing():void {
    this.client.publish({
      destination: "/app/writing",
      body: this.message.user
    });
  }
}
