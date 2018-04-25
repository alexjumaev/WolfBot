import * as utils from "@ekliptor/apputils";
const logger = utils.logger
    , nconf = utils.nconf;
import * as EventEmitter from 'events';
import {Currency, Trade, Order, Candle} from "@ekliptor/bit-models";

export abstract class CandleStream<T extends Trade.SimpleTrade> extends EventEmitter {
    protected currencyPair: Currency.CurrencyPair;
    protected exchange: Currency.Exchange;

    constructor(currencyPair: Currency.CurrencyPair, exchange: Currency.Exchange = Currency.Exchange.ALL) {
        super()
        this.currencyPair = currencyPair;
        this.exchange = exchange;
        this.setMaxListeners(nconf.get('maxEventListeners'));
    }

    public getCurrencyPair() {
        return this.currencyPair;
    }

    public getExchange() {
        return this.exchange;
    }

    public setExchange(exchange: Currency.Exchange) {
        this.exchange = exchange;
    }

    // ################################################################
    // ###################### PRIVATE FUNCTIONS #######################

    protected emitCandles(candles: Candle.Candle[]) {
        if (candles.length === 0)
            return;
        this.emit("candles", candles);
    }

    protected static computeCandleTrend(candle: Candle.Candle) {
        if (Math.abs(candle.getPercentChange()) <= nconf.get('serverConfig:candleEqualPercent'))
            candle.trend = "none";
        else
            candle.trend = candle.close > candle.open ? "up" : "down";
    }
}