import * as utils from "@ekliptor/apputils";
const logger = utils.logger
    , nconf = utils.nconf;
import {Currency, BotTrade} from "@ekliptor/bit-models";
import {TradeDirection} from "./AbstractTrader";
import * as path from "path";
import {AbstractConfig, BotConfigMode} from "./AbstractConfig";

export type ConfigCurrencyPair = string;

export interface ConfigRuntimeUpdate {
    marginTrading: boolean;
    tradeTotalBtc: number;
    tradeDirection: TradeDirection;
    warmUpMin: number;
}

export class TradeConfig extends AbstractConfig {
    //public readonly name: string = "";
    public readonly exchanges: string[] = null;
    public readonly markets: Currency.CurrencyPair[] = [];
    public readonly marginTrading = true;
    public readonly tradeTotalBtc = 0.0; // will be leveraged 2.5 if marginTrading is enabled
    public readonly tradeDirection: TradeDirection = "both";
    public readonly warmUpMin: number = 0;
    public readonly notifyTrades: boolean = false;
    //public readonly strategies: any; // not stored here. strategies have their own instances
    //public readonly configNr: number = 0;
    // TODO an option (and exchange API call) to cancel all open stop orders when closing a position

    //protected static nextConfigNr: number = 0;

    constructor(json: any, configName: string) {
        super(json, configName)
        if (json.exchanges) {
            if (json.exchanges === "default")
                this.exchanges = nconf.get("defaultExchanges")
            else
                this.exchanges = json.exchanges;
            if (!Array.isArray(this.exchanges))
                this.exchanges = [this.exchanges] // happens when running backfind
        }
        else
            this.exchanges = nconf.get("defaultExchanges")
        this.loadMarkets(json.strategies)
        /*
        json.markets.forEach((market) => {
            let pair = TradeConfig.getCurrencyPair(market)
            this.markets.push(pair)
        })
        */
        if (typeof json.marginTrading === "boolean")
            this.marginTrading = json.marginTrading;
        this.tradeTotalBtc = json.tradeTotalBtc;
        if (json.tradeDirection === "up" || json.tradeDirection === "down" || json.tradeDirection === "both")
            this.tradeDirection = json.tradeDirection;
        if (json.warmUpMin)
            this.warmUpMin = parseInt(json.warmUpMin);
        if (typeof json.notifyTrades === "boolean")
            this.notifyTrades = json.notifyTrades;
    }

    public static resetCounter() {
        //TradeConfig.nextConfigNr = 0;
        AbstractConfig.resetCounter();
    }

    public getConfigCurrencyPair(currencyPair: Currency.CurrencyPair): ConfigCurrencyPair {
        return TradeConfig.createConfigCurrencyPair(this.configNr, currencyPair);
    }

    public static createConfigCurrencyPair(configNr: number, currencyPair: Currency.CurrencyPair): ConfigCurrencyPair {
        return configNr + "-" + currencyPair.toString();
    }

    public listConfigCurrencyPairs() {
        let pairs: ConfigCurrencyPair[] = []
        this.markets.forEach((currencyPair) => {
            pairs.push(this.getConfigCurrencyPair(currencyPair))
        })
        return pairs;
    }

    public hasCurrency(currencyPair: Currency.CurrencyPair) {
        for (let i = 0; i < this.markets.length; i++)
        {
            if (this.markets[i].equals(currencyPair))
                return true;
        }
        return false;
    }

    public static getCurrencyPair(configPair: string): Currency.CurrencyPair {
        let pair = configPair.split("_")
        let cur1 = Currency.Currency[pair[0]]
        let cur2 = Currency.Currency[pair[1]]
        if (!cur1 || !cur2) {
            logger.error("Unknown currency pair in config: %s", configPair)
            return undefined;
        }
        return new Currency.CurrencyPair(cur1, cur2)
    }

    public update(update: ConfigRuntimeUpdate) {
        //this.warmUpMin = update.warmUpMin;
        // TODO add/remove properties is not working
        for (let prop in update)
        {
            if (update[prop] !== undefined) // don't set invalid values (removing means setting them to 0/null)
                this[prop] = update[prop];
        }
    }

    protected loadMarkets(strategies) {
        let markets = new Set<string>();
        // TODO move currencyPair out of strategy and to root config (and then forward it to strategies)
        for (let name in strategies)
            markets.add(strategies[name].pair)
        if (markets.size > 1)
            logger.error("More than 1 currency pair per strategy group is not supported. found %s", markets.size)
        for (let pairStr of markets)
        {
            let pair = TradeConfig.getCurrencyPair(pairStr)
            if (pair === undefined)
                throw new Error("Can not load config markets");
            this.markets.push(pair)
        }
    }

    public static getConfigDir() {
        if (nconf.get("ai"))
            return path.join(utils.appDir, "config", "machine-learning")
        else if (nconf.get("lending"))
            return path.join(utils.appDir, "config", "lending")
        else if (nconf.get("arbitrage"))
            return path.join(utils.appDir, "config", "arbitrage")
        else if (nconf.get("social"))
            return path.join(utils.appDir, "config", "social")
        return path.join(utils.appDir, "config") // trading
    }

    public static getConfigDirForMode(mode: BotConfigMode) {
        if (mode === "ai")
            return path.join(utils.appDir, "config", "machine-learning")
        else if (mode === "lending")
            return path.join(utils.appDir, "config", "lending")
        else if (mode === "arbitrage")
            return path.join(utils.appDir, "config", "arbitrage")
        else if (mode === "social")
            return path.join(utils.appDir, "config", "social")
        return path.join(utils.appDir, "config") // trading
    }
}