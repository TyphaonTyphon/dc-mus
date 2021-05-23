import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["vol", "v"],
    name: "ses",
    description: "Parça sesini gösterin veya ayarlayın",
    usage: "{prefix}volume [istediğiniz ses seviyesi]"
})
export class VolumeCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage, args: string[]): any {
        let volume = Number(args[0]);

        if (isNaN(volume)) return message.channel.send(createEmbed("info", `🔊  **|**  Mevcut ses düzeyi **\`${message.guild!.queue!.volume.toString()}\`**`));

        if (volume < 0) volume = 0;
        if (volume === 0) return message.channel.send(createEmbed("warn", "Lütfen sesi ayarlamak yerine müziği duraklatın **\`0\`**"));
        if (Number(args[0]) > this.client.config.maxVolume) {
            return message.channel.send(
                createEmbed("warn", `Sesi maksimumun üstüne ayarlayamazsınız. Maksimum = **\`${this.client.config.maxVolume}\`**`)
            );
        }

        message.guild!.queue!.volume = Number(args[0]);
        message.guild!.queue!.connection?.dispatcher.setVolume(Number(args[0]) / this.client.config.maxVolume);
        message.channel.send(createEmbed("info", `🔊  **|**  Ses seviyesi **\`${args[0]}\`**`)).catch(console.error);
    }
}