import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["loop", "music-repeat", "music-loop", "tekrar", "l", "t"],
    name: "tekrar",
    description: "Mevcut parçayı veya kuyruğu tekrarla",
    usage: "{prefix}repeat <hepsi | tek | kapat>"
})
export class RepeatCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage, args: string[]): any {
        const mode = args[0];
        if (mode === "hepsi" || mode === "kuyruk" || mode === "*" || mode === "2") {
            message.guild!.queue!.loopMode = 2;
            return message.channel.send(createEmbed("info", "🔁  **|**  Kuyruktaki tüm müziği tekrarlayacak."));
        } else if (mode === "bu" || mode === "tek" || mode === "." || mode === "1") {
            message.guild!.queue!.loopMode = 1;
            return message.channel.send(createEmbed("info", "🔂  **|**  Sadece bu müziği tekrarlayacak."));
        } else if (mode === "kapat" || mode === "kapalı" || mode === "0") {
            message.guild!.queue!.loopMode = 0;
            return message.channel.send(createEmbed("info", "▶  **|**  Tekrarlama devre dışı."));
        }
        message.channel.send(`Invalid value, see **\`${this.client.config.prefix}help ${this.meta.name}\`** for more information!`).catch(e => this.client.logger.error("REPEAT_CMD_ERR:", e));
    }
}