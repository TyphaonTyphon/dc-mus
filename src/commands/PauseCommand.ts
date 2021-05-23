import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["pause", "b", "durdur", "bekle"],
    name: "durdur",
    description: "Parçayı durdur",
    usage: "{prefix}bekle"
})
export class PauseCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage): any {
        if (message.guild?.queue?.playing) {
            message.guild.queue.playing = false;
            message.guild.queue.connection?.dispatcher.pause();
            return message.channel.send(createEmbed("info", "⏸  **|**  Müziği durduruldu."));
        }
        message.channel.send(createEmbed("warn", "Müzik zaten duraklatılmış."))
            .catch(e => this.client.logger.error("PAUSE_CMD_ERR:", e));
    }
}