import { BaseCommand } from "../structures/BaseCommand";
import { version } from "discord.js";
import { uptime as osUptime } from "os";
import path from "path";
import { formatMS } from "../utils/formatMS";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["durum", "about", "botinfo", "info", "stats"],
    name: "bilgi",
    description: "Bot bilgilerini öğrenin",
    usage: "{prefix}bilgi"
})
export class AboutCommand extends BaseCommand {
    public async execute(message: IMessage): Promise<void> {
        message.channel.send(
            createEmbed("info", `
\`\`\`asciidoc
Kullanıcı sayısı    :: ${await this.client.getUsersCount()}
Kanal sayısı        :: ${await this.client.getChannelsCount()}
Sunucu sayısı       :: ${await this.client.getGuildsCount()}
Parçaların sayısı   :: ${this.client.shard ? `${this.client.shard.count}` : "N/A"}
Parça Kimliği       :: ${this.client.shard ? `${this.client.shard.ids[0]}` : "N/A"}
Müzik çalma         :: ${await this.client.getTotalPlaying()} guilds
Platform            :: ${process.platform}
Arch                :: ${process.arch}
Memory              :: ${this.bytesToSize(await this.client.getTotalMemory("rss"))}
OS çalışma süresi   :: ${formatMS(osUptime() * 1000)}
Süreç çalışma süresi:: ${formatMS(process.uptime() * 1000)}
Bot çalışma süresi  :: ${formatMS(this.client.uptime!)}
Node.JS versiyonu   :: ${process.version}
Discord.JS versiyonu:: v${version}
Bot versiyonu       :: v${(await import(path.join(process.cwd(), "package.json"))).version}
Kaynak Kodu         :: https://github.com/TyphaonTyphon/my-template.git
Destek İçin         :: https://zhycorp.com/discord
\`\`\`
        `)
                .setAuthor(`${this.client.user?.username as string} - Basit bir açık kaynaklı Discord müzik botu`)
        ).catch(e => this.client.logger.error("ABOUT_CMD_ERR:", e));
    }

    private bytesToSize(bytes: number): string { // Function rrom Rendang's util (https://github.com/Hazmi35/rendang)
        if (isNaN(bytes) && bytes !== 0) throw new Error(`[bytesToSize] (bytes) Error: bytes is not a Number/Integer, received: ${typeof bytes}`);
        const sizes: string[] = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
        if (bytes < 2 && bytes > 0) return `${bytes} Byte`;
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString(), 10);
        if (i === 0) return `${bytes} ${sizes[i]}`;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (sizes[i] === undefined) return `${bytes} ${sizes[sizes.length - 1]}`;
        return `${Number(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }
}