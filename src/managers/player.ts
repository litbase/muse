import {inject, injectable} from 'inversify';
import {TYPES} from '../types.js';
import Player from '../services/player.js';
import FileCacheProvider from '../services/file-cache.js';
import container from "../inversify.config.js";
import Config from "../services/config.js";
import fs from "node:fs";
import ytdl from "@distube/ytdl-core";

@injectable()
export default class {
  private readonly guildPlayers: Map<string, Player>;
  private readonly fileCache: FileCacheProvider;
  private agent: ytdl.Agent | null = null;

  constructor(@inject(TYPES.FileCache) fileCache: FileCacheProvider) {
    this.guildPlayers = new Map();
    this.fileCache = fileCache;
  }

  get(guildId: string): Player {
    let player = this.guildPlayers.get(guildId);

    if (!player) {
      player = new Player(this.fileCache, guildId, this.getAgent());

      this.guildPlayers.set(guildId, player);
    }

    return player;
  }

  getAgent(): ytdl.Agent {
    return this.agent ?? (this.agent = this.buildAgent());
  }

  buildAgent(): ytdl.Agent {
    try {
      const config = container.get<Config>(TYPES.Config);
      const fileExists = fs.existsSync(config.COOKIES_JSON_PATH);

      if (!fileExists) {
        console.warn("No cookies file found at", config.COOKIES_JSON_PATH);
        return ytdl.createAgent();
      }

      const cookies = JSON.parse(fs.readFileSync(config.COOKIES_JSON_PATH, "utf8"));
      const agent = ytdl.createAgent(cookies);
      console.log("Agent successfully loaded from cookies");
      return agent;
    }
    catch (error) {
      console.error("Error while loading cookies", error);
      return ytdl.createAgent();
    }
  }
}
