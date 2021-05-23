import { BaseCommand } from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["h", "command", "commands", "cmd", "cmds", "y", "yardım"],
    name: "yardım",
    description: "Yardım menüsünü veya komut listesini gösterir",
    usage: "{prefix}yardım [komut]"
})
export class HelpCommand extends BaseCommand {
    public execute(message: IMessage, args: string[]): void {
        const command = message.client.commands.get(args[0]) ??
            message.client.commands.get(message.client.commands.aliases.get(args[0])!);
        if (command && !command.meta.disable) {
            message.channel.send(
                new MessageEmbed()
                    .setTitle(`${command.meta.name} komutu için bilgi`)
                    .setThumbnail("https://hzmi.xyz/assets/images/question_mark.png")
                    .addFields({ name: "Adı", value: `\`${command.meta.name}\``, inline: true },
                        { name: "Yorum", value: command.meta.description, inline: true },
                        { name: "Takma adlar", value: `${Number(command.meta.aliases?.length) > 0 ? command.meta.aliases?.map(c => `\`${c}\``).join(", ") as string : "None."}`, inline: false },
                        { name: "Kullanım", value: `\`${command.meta.usage?.replace(/{prefix}/g, message.client.config.prefix) as string}\``, inline: true })
                    .setColor(this.client.config.embedColor)
                    .setTimestamp()
            ).catch(e => this.client.logger.error("HELP_CMD_ERR:", e));
        } else {
            message.channel.send(
                createEmbed("info", message.client.commands.filter(cmd => !cmd.meta.disable && cmd.meta.name !== "eval").map(c => `\`${c.meta.name}\``).join(" "))
                    .setTitle(`${this.client.user?.username as string} - command list`)
                    .setColor(this.client.config.embedColor)
                    .setThumbnail(message.client.user?.displayAvatarURL() as string)
                    .setFooter(`Bir komut hakkında daha fazla bilgi edinmek için ${message.client.config.prefix}help <command> !`, "https://hzmi.xyz/assets/images/390511462361202688.png")
            ).catch(e => this.client.logger.error("HELP_CMD_ERR:", e));
        }
    }
}