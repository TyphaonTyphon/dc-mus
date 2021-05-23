import { Snowflake, TextChannel, Collection, GuildMember } from "discord.js";
import { formatMS } from "../utils/formatMS";
import { IVoiceState } from "../../typings";
import { DefineListener } from "../utils/decorators/DefineListener";
import { createEmbed } from "../utils/createEmbed";
import { BaseListener } from "../structures/BaseListener";

@DefineListener("voiceStateUpdate")
export class VoiceStateUpdateEvent extends BaseListener {
    public execute(oldState: IVoiceState, newState: IVoiceState): any {
        if (newState.guild.queue) {
            const oldID = oldState.channel ? oldState.channel.id : undefined;
            const newID = newState.channel ? newState.channel.id : undefined;
            const musicVcID = newState.guild.queue.voiceChannel?.id;

            // Handle when bot gets kicked from the voice channel
            if (oldState.id === this.client.user?.id && oldID === newState.guild.queue.voiceChannel?.id && newID === undefined) {
                try {
                    this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} ${newState.guild.name} adresindeki bir ses kanalından bağlantı kesildi, sıra silindi.`);
                    newState.guild.queue.textChannel?.send(createEmbed("warn", "Ses kanalından az önce bağlantım kesildi, sıra silinecek."))
                        .catch(e => this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e));
                    return newState.guild.queue = null;
                } catch (e) {
                    this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e);
                }
            }

            // Handle when the bot is moved to another voice channel
            if (oldState.member?.user.id === this.client.user?.id && oldID === musicVcID && newID !== musicVcID) {
                const vc = newState.channel?.members.filter(m => !m.user.bot);
                if (vc?.size === 0 && newState.guild.queue?.timeout === null) this.doTimeout(vc, newState);

                this.resumeTimeout(vc, newState);
                newState.guild.queue!.voiceChannel = newState.channel;
            }

            const vc = newState.guild.queue?.voiceChannel?.members.filter(m => !m.user.bot);
            // Handle when user leaves voice channel
            if (oldID === musicVcID && newID !== musicVcID && !newState.member?.user.bot && newState.guild.queue?.timeout === null) this.doTimeout(vc, newState);

            // Handle when user joins voice channel or bot gets moved
            if (newID === musicVcID && !newState.member?.user.bot) this.resumeTimeout(vc, newState);
        }
    }

    private doTimeout(vc: Collection<string, GuildMember> | undefined, newState: IVoiceState): any {
        try {
            if (vc?.size === 0) {
                clearTimeout(newState.guild.queue?.timeout as NodeJS.Timeout);
                newState.guild.queue!.timeout = null;
                newState.guild.queue!.playing = false;
                newState.guild.queue?.connection?.dispatcher.pause();
                const timeout = this.client.config.deleteQueueTimeout;
                const duration = formatMS(timeout);
                newState.guild.queue?.textChannel?.send(
                    createEmbed("warn", "Ses kanalı boş. Kaynakları korumak için sıra duraklatıldı. " +
                    `Bir sonraki **\`${duration}\`**, içinde ses kanalıma katılan kimse olmazsa, sıra silinecek.`)
                        .setTitle("⏸ Sıra durduruldu")
                )
                    .catch(e => this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e));
                return newState.guild.queue!.timeout = setTimeout(() => {
                    newState.guild.queue?.connection?.dispatcher.once("speaking", () => {
                        newState.guild.queue?.songs.clear();
                        const textChannel = this.client.channels.resolve(newState.guild.queue?.textChannel?.id as Snowflake) as TextChannel;
                        newState.guild.queue?.connection?.dispatcher.end(() => {
                            textChannel.send(
                                createEmbed("error", `**\`${duration}\`** geçti ve ses kanalıma giren kimse yok, sıra silindi.`)
                                    .setTitle("⏹ Sıra silindi")
                            ).catch(e => this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e));
                        });
                    });
                    newState.guild.queue!.playing = true;
                    newState.guild.queue?.connection?.dispatcher.resume(); // I don't know why but I think I should resume and then end the dispatcher or it won't work
                }, timeout);
            }
        } catch (e) { this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e); }
    }

    private resumeTimeout(vc: Collection<string, GuildMember> | undefined, newState: IVoiceState): void {
        if (Number(vc?.size) > 0) {
            if (Number(vc?.size) === 1) { clearTimeout(newState.guild.queue?.timeout as NodeJS.Timeout); newState.guild.queue!.timeout = null; }
            if (!newState.guild.queue?.playing && Number(vc?.size) < 2) {
                try {
                    const song = newState.guild.queue?.songs.first();
                    newState.guild.queue?.textChannel?.send(
                        createEmbed("info", `Birisi ses kanalına katıldı. Sıradaki müziğin keyfini çıkarın!\n🎶  **|**  Şimdi çalıyor: **[${song!.title}](${song!.url})**`)
                            .setThumbnail(song!.thumbnail)
                            .setTitle("▶ Queue resumed")
                    ).catch(e => this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e));
                    newState.guild.queue!.playing = true;
                    newState.guild.queue?.connection?.dispatcher.resume();
                } catch (e) {
                    this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e);
                }
            }
        }
    }
}
