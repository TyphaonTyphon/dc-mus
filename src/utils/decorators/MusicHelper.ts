/* eslint-disable func-names */
import { ICommandComponent, IMessage } from "../../../typings";
import { createEmbed } from "../createEmbed";

export function inhibit(func: ICommandComponent["execute"]) {
    return function decorate(target: unknown, key: string | symbol, descriptor: PropertyDescriptor): any {
        const original = descriptor.value;
        descriptor.value = async function (message: IMessage, args: string[]): Promise<any> {
            const result = await func(message, args);
            if (result === undefined) return original.apply(this, [message, args]);
            return null;
        };

        return descriptor;
    };
}

export function isMusicPlaying(): any {
    return inhibit(message => {
        if (message.guild?.queue === null) return message.channel.send(createEmbed("warn", "Hiçbir şey oynamıyor."));
    });
}

export function isSameVoiceChannel(): any {
    return inhibit(message => {
        if (!message.guild?.me?.voice.channel) return undefined;
        if (message.member?.voice.channel?.id !== message.guild.queue?.voiceChannel?.id) {
            return message.channel.send(
                createEmbed("warn", "Benimki ile aynı ses kanalında olmalısın")
            );
        }
    });
}

export function isUserInTheVoiceChannel(): any {
    return inhibit(message => {
        if (!message.member?.voice.channel) {
            return message.channel.send(
                createEmbed("warn", "Üzgünüm ama bunu yapmak için bir ses kanalında olman gerekiyor")
            );
        }
    });
}

export function isValidVoiceChannel(): any {
    return inhibit(message => {
        const voiceChannel = message.member?.voice.channel;
        if (!voiceChannel?.joinable) {
            return message.channel.send(createEmbed("error", "Üzgünüm ama ses kanalınıza bağlanamıyorum, uygun izinlerim olduğundan emin olun!"));
        }
        if (!voiceChannel.speakable) {
            voiceChannel.leave();
            return message.channel.send(createEmbed("error", "Üzgünüm ama ses kanalınıza bağlanamıyorum, uygun izinlerim olduğundan emin olun!"));
        }
    });
}
