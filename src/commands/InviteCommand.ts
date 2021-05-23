import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { createEmbed } from "../utils/createEmbed";
import { disableInviteCmd } from "../config";

@DefineCommand({
    name: "davet",
    description: "Botun davet bağlantısını alın",
    usage: "{prefix}davet",
    disable: disableInviteCmd
})
export class InviteCommand extends BaseCommand {
    public async execute(message: IMessage): Promise<void> {
        message.channel.send(
            createEmbed("info")
                .addField("Discord bot davet bağlantısı", `[Buraya Tıkla](${await this.client.generateInvite({ permissions: 53857345 })})`)
        ).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
    }
}