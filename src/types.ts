type roomsType = {
    [id: string]: {
      player: {
        socketId: string;
        symbol: string;
      }[];
      board: (string | null)[];
    };
  };
  