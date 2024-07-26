const DiscordRPC = require('discord-rpc');

exports.createDiscordRPC = async() => {
    const clientId = '1247204532648153160';
    const rpc = new DiscordRPC.Client({ transport: 'ipc' });

    rpc.on('ready', () => {
        console.log('Discord RPC connected');
        rpc.setActivity({
            details: 'Fighting in Africa',
            state: 'Safari and Hippopotamus!',
            startTimestamp: new Date(),
            largeImageKey: 'africa512',
            largeImageText: 'African Dawn',
            smallImageKey: 'hippopotamus-2780699_1280',
            smallImageText: 'Hippopotamus',
        });
    });

    rpc.login({ clientId }).catch(console.error);
    return rpc;
}