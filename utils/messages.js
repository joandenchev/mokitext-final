import moment from "moment";

export default class Message {
  time; text; sender;
  constructor(sender, text) {
    this.time = moment().format('h:mm a')
    this.text  = text;
    this.sender = sender;
  }
}
export class ChatRoom {
  id
  name
  messages
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.messages = []
  }
}
