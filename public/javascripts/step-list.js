angular.module('playlist').value('stepList', [
	{
        num: 1,
        text: 'What type of playlist do you want to make?',
        next: '/genre',
        current: '/'
    },
    {
        num: 2,
        text: 'Select up to four genres.',
        next: '/song',
        current: '/genre',
        prev: '/'
    },
    {
        num: 3,
        text: 'Type the name of a song to generate similar songs for the playlist.',
        next: '/popular',
        current: '/song',
        prev: '/genre'

    },
    {
        num: 4,
        text: 'Do you want only popular songs to be included?',
        current: '/popular',
        prev: '/song',
        next: '/playlist'
    },
    {
        num: 5,
        current: '/playlist',
        prev: '/popular',
        next: '/done'
    },
    {
        num: 6,
        current: '/done'
    }
]);

