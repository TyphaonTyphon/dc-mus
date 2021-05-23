import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isMusicPlaying } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["np", "now-playing", "çalan", "ç"],
    name: "çalan",
    description: "Parça hakkında bilgi gönderin",
    usage: "{prefix}çalan"
})
export class NowPlayingCommand extends BaseCommand {
    @isMusicPlaying()
    public execute(message: IMessage): any {
        const song = message.guild?.queue?.songs.first();
        return message.channel.send(
            createEmbed("info", `${message.guild?.queue?.playing ? "▶  **|**  Şimdi çalıyor:" : "⏸  **|**  Şimdi çalıyor (duraklatıldı):"} ` +
                `**[${song?.title as string}](${song?.url as string})**`)
                .setThumbnail(song?.thumbnail as string)
        );
    }
}