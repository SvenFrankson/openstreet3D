interface ITweet {
    author: string;
    content: string;
    time: number;
}

interface ICoordinates {
    
}

interface ISniffMap {
    popTweet: (tweet: ITweet) => void;
}