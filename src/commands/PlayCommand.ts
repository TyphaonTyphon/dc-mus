/* eslint-disable block-scoped-var, @typescript-eslint/restrict-template-expressions */
import { BaseCommand } from "../structures/BaseCommand";
import { ServerQueue } from "../structures/ServerQueue";
import { playSong } from "../utils/YoutubeDownload";
import { Util, MessageEmbed, VoiceChannel } from "discord.js";
import { decodeHTML } from "entities";
import { IMessage, ISong, IGuild } from "../../typings";
import { Video } from "../utils/YoutubeAPI/structures/Video";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isSameVoiceChannel, isValidVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["p", "add", "play-music", "o", "oynat"],
    name: "oynat",
    description: "Biraz müzik oynat.",
    usage: "{prefix}oynat <youtube video veya youtube video adı veya oynatma listesi linki>"
})
export class PlayCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isValidVoiceChannel()
    @isSameVoiceChannel()
    public async execute(message: IMessage, args: string[]): Promise<any> {
        const voiceChannel = message.member!.voice.channel!;
        if (!args[0]) {
            return message.channel.send(
                createEmbed("warn", `Geçersiz bağımsız değişkenler, daha fazla bilgi için **\`$ {this.client.config.prefix} yardım play \`** yazın.`)
            );
        }
        const searchString = args.join(" ");
        const url = searchString.replace(/<(.+)>/g, "$1");

        if (message.guild?.queue !== null && voiceChannel.id !== message.guild?.queue.voiceChannel?.id) {
            return message.channel.send(
                createEmbed("warn", `Bu sunucudaki müzik şu cihazlarda zaten çalıyor: **\`$ {message.guild? .Queue.voiceChannel? .Name}\`** ses kanalı`)
            );
        }

        if (/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/.exec(url)) {
            try {
                const playlist = await this.client.youtube.getPlaylistByURL(url);
                const videos = await playlist.getVideos();
                let skippedVideos = 0;
                message.channel.send(createEmbed("info", `Tüm videoları oynatma listesine ekliyorum: **[${playlist.title}](${playlist.url})**, dayan...`))
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                for (const video of Object.values(videos)) {
                    if (video.status.privacyStatus === "private") {
                        skippedVideos++;
                        continue;
                    } else {
                        const video2 = await this.client.youtube.getVideo(video.id);
                        await this.handleVideo(video2, message, voiceChannel, true);
                    }
                }
                if (skippedVideos !== 0) {
                    message.channel.send(
                        createEmbed("warn", `${skippedVideos} ${skippedVideos >= 2 ? `videos` : `video`} are skipped because it's a private video`)
                    ).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                }
                if (skippedVideos === playlist.itemCount) return message.channel.send(createEmbed("error", `Failed to load **[${playlist.title}](${playlist.url})** playlist because all of items are private video.`));
                return message.channel.send(createEmbed("info", `✅  **|**  İçindeki tüm videolar **[${playlist.title}](${playlist.url})**, sıraya eklendi!`));
            } catch (e) {
                if (e.response.body.error.message === '<a href="/youtube/v3/getting-started#quota"> kotanızı </a> aştığınız için istek tamamlanamıyor.') {
                    this.client.logger.error("YT_PLAYLIST_ERR:", new Error("YouTube Data API v3 kotası aşıldı"));
                    return message.channel.send(createEmbed("error", `Error: \`YouTube Data API v3 kotası aşıldı \`,lütfen bot sahibiyle iletişime geçin.`));
                }
                this.client.logger.error("YT_PLAYLIST_ERR:", e);
                return message.channel.send(createEmbed("error", `Oynatma listesini yükleyemiyorum.\nError: \`${e.message}\``));
            }
        }
        try {
            // eslint-disable-next-line no-var, block-scoped-var
            var video = await this.client.youtube.getVideoByURL(url);
        } catch (e) {
            try {
                const videos = await this.client.youtube.searchVideos(searchString, this.client.config.searchMaxResults);
                if (videos.length === 0) return message.channel.send(createEmbed("error", "Herhangi bir arama sonucu elde edemedim."));
                if (this.client.config.disableSongSelection) { video = await this.client.youtube.getVideo(videos[0].id); } else {
                    let index = 0;
                    const msg = await message.channel.send(new MessageEmbed()
                        .setAuthor("şarkı Seçimi")
                        .setDescription(`\`\`\`\n${videos.map(video => `${++index} - ${this.cleanTitle(video.title)}`).join("\n")}\`\`\`\n` +
                        `Lütfen aşağıdakilerden arama sonuçlarından birini seçmek için bir değer girin **\`1-${this.client.config.searchMaxResults}\`**!`)
                        .setThumbnail(message.client.user?.displayAvatarURL() as string)
                        .setColor(this.client.config.embedColor)
                        .setFooter("• Seçimi iptal veya i yazarak iptal edebilirsiniz."));
                    try {
                    // eslint-disable-next-line no-var
                        var response = await message.channel.awaitMessages((msg2: IMessage) => {
                            if (message.author.id !== msg2.author.id) return false;

                            if (msg2.content === "iptal" || msg2.content === "i" || msg2.content === "cancel" || msg2.content === "c") return true;
                            return Number(msg2.content) > 0 && Number(msg2.content) < 13;
                        }, {
                            max: 1,
                            time: this.client.config.selectTimeout,
                            errors: ["time"]
                        });
                        msg.delete().catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                        response.first()?.delete({ timeout: 3000 }).catch(e => e); // do nothing
                    } catch (error) {
                        msg.delete().catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                        return message.channel.send(createEmbed("error", "Değer girilmedi veya geçersiz, şarkı seçimi iptal edildi."));
                    }
                    if (response.first()?.content === "c" || response.first()?.content === "cancel") {
                        return message.channel.send(createEmbed("warn", "Şarkı seçimi iptal edildi."));
                    }
                    const videoIndex = parseInt(response.first()?.content as string, 10);
                    video = await this.client.youtube.getVideo(videos[videoIndex - 1].id);
                }
            } catch (err) {
                if (e.response.body.error.message === '<a href="/youtube/v3/getting-started#quota"> kotanızı </a> aştığınız için istek tamamlanamıyor.') {
                    this.client.logger.error("YT_SEARCH_ERR:", new Error("YouTube Data API v3 kotası aşıldı"));
                    return message.channel.send(createEmbed("error", `Hata: \`YouTube Data API v3 kotası aşıldı\`, lütfen bot sahibiyle iletişime geçin.`));
                }
                this.client.logger.error("YT_SEARCH_ERR:", err);
                return message.channel.send(createEmbed("error", `Herhangi bir arama sonucu elde edemedim.\nError: \`${err.message}\``));
            }
        }
        return this.handleVideo(video, message, voiceChannel);
    }

    private async handleVideo(video: Video, message: IMessage, voiceChannel: VoiceChannel, playlist = false): Promise<any> {
        const song: ISong = {
            id: video.id,
            title: this.cleanTitle(video.title),
            url: video.url,
            thumbnail: video.thumbnailURL
        };
        if (message.guild?.queue) {
            if (!this.client.config.allowDuplicate && message.guild.queue.songs.find(s => s.id === song.id)) {
                return message.channel.send(
                    createEmbed("warn", `Şarkı: **[${song.title}](${song.id})** zaten sıraya alındı ​​ve bu bot yapılandırması, yinelenen şarkının kuyrukta olmasına izin vermiyor, ` +
                `please use \`${this.client.config.prefix}repeat\` instead`)
                        .setTitle("⌛ Zaten sıraya alındı")
                );
            }
            message.guild.queue.songs.addSong(song);
            if (playlist) return;
            message.channel.send(createEmbed("info", `✅  **|**  **[${song.title}](${song.url})** sıraya eklendi!`).setThumbnail(song.thumbnail))
                .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
        } else {
            message.guild!.queue = new ServerQueue(message.channel, voiceChannel);
            message.guild?.queue.songs.addSong(song);
            try {
                const connection = await message.guild?.queue.voiceChannel?.join();
                message.guild!.queue.connection = connection!;
            } catch (error) {
                message.guild?.queue.songs.clear();
                message.guild!.queue = null;
                this.client.logger.error("PLAY_CMD_ERR:", error);
                message.channel.send(createEmbed("error", `Hata: Ses kanalına katılamadı çünkü:\n\`${error}\``))
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                return undefined;
            }
            this.play(message.guild!).catch(err => {
                message.channel.send(createEmbed("error", `Müzik çalmaya çalışırken hata:\n\`${err}\``))
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                return this.client.logger.error("PLAY_CMD_ERR:", err);
            });
        }
        return message;
    }

    private async play(guild: IGuild): Promise<any> {
        const serverQueue = guild.queue!;
        const song = serverQueue.songs.first();
        if (!song) {
            serverQueue.textChannel?.send(
                createEmbed("info", `⏹  **|**  Sıra bitti, daha fazla şarkı çalmak için **\`${guild.client.config.prefix}oynat\`**'ı tekrar kullanın!`)
            ).catch(e => this.client.logger.error("PLAY_ERR:", e));
            serverQueue.connection?.disconnect();
            return guild.queue = null;
        }

        serverQueue.connection?.voice?.setSelfDeaf(true).catch(e => this.client.logger.error("PLAY_ERR:", e));
        const songData = await playSong(song.url, { cache: this.client.config.cacheYoutubeDownloads, cacheMaxLength: this.client.config.cacheMaxLengthAllowed });

        if (songData.cache) this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids}]` : ""} Using cache for song "${song.title}" on ${guild.name}`);

        serverQueue.connection?.play(songData.stream, { type: songData.canDemux ? "webm/opus" : "unknown", bitrate: "auto", highWaterMark: 1 })
            .on("start", () => {
                serverQueue.playing = true;
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids}]` : ""} Müzik: "${song.title}" on ${guild.name} has started`);
                serverQueue.textChannel?.send(createEmbed("info", `▶  **|**  Oynuyor: **[${song.title}](${song.url})**`).setThumbnail(song.thumbnail))
                    .catch(e => this.client.logger.error("PLAY_ERR:", e));
            })
            .on("finish", () => {
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids}]` : ""} Müzik: "${song.title}" on ${guild.name} has ended`);
                // eslint-disable-next-line max-statements-per-line
                if (serverQueue.loopMode === 0) { serverQueue.songs.deleteFirst(); } else if (serverQueue.loopMode === 2) { serverQueue.songs.deleteFirst(); serverQueue.songs.addSong(song); }
                /* serverQueue.textChannel?.send(createEmbed("info", `⏹  **|**  Durduruldu: **[${song.title}](${song.url})**`).setThumbnail(song.thumbnail))
                    .catch(e => this.client.logger.error("PLAY_ERR:", e)); */
                this.play(guild).catch(e => {
                    serverQueue.textChannel?.send(createEmbed("error", `Error while trying to play music:\n\`${e}\``))
                        .catch(e => this.client.logger.error("PLAY_ERR:", e));
                    serverQueue.connection?.dispatcher.end();
                    return this.client.logger.error("PLAY_ERR:", e);
                });
            })
            .on("error", (err: Error) => {
                this.client.logger.error("PLAY_ERR:", err);
            })
            .setVolume(serverQueue.volume / guild.client.config.maxVolume);
    }

    private cleanTitle(title: string): string {
        return Util.escapeMarkdown(decodeHTML(title));
    }
}