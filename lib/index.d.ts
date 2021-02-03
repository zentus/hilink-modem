// Type definitions for hilink-modem

export = Modem;

interface ModemOptions {
    modemIp?: string;
    messageDelay?: number;
    bigMessageDelay?: number;
    sendMessageStatusDelay?: number;
    waitForPendingRequest?: boolean;
    webUiVersion?: string;
}

interface ApiRequestOptions {
    method: "GET" | "POST" | "PUT" | "PATCH" | "HEAD" | "DELETE";
    body?: any;
}

interface GetMessageOptions {
    count?: number; 
    page?: number; 
    type?: "received" | "sent" | "drafted", 
    sort?: "ascending" | "descending"
}

interface SendMessageOptions {
    receiver: string;
    text: string;
}

interface TrafficStatistics {
    CurrentConnectTime: number;
    CurrentUpload: number;
    CurrentDownload: number;
    CurrentDownloadRate: number;
    CurrentUploadRate: number;
    TotalUpload: number;
    TotalConnectTime: number;
    showtraffic: number;
}

interface Status {
    ConnectionStatus: number,
    WifiConnectionStatus: string,
    SignalStrength: string,
    SignalIcon: number,
    CurrentNetworkType: number,
    CurrentServiceDomain: number,
    RoamingStatus: number,
    BatteryStatus: string,
    BatteryLevel: string,
    BatteryPercent: string,
    simlockStatus: number,
    PrimaryDns: string,
    SecondaryDns: string,
    wififrequence: number,
    flymode: number,
    PrimaryIPv6Dns: string,
    SecondaryIPv6Dns: string,
    CurrentWifiUser: string,
    TotalWifiUser: string,
    currenttotalwifiuser: number,
    ServiceStatus: number,
    SimStatus: number,
    WifiStatus: string,
    CurrentNetworkTypeEx: number,
    maxsignal: number,
    wifiindooronly: number,
    classify: string,
    usbup: number,
    wifiswitchstatus: number,
    WifiStatusExCustom: number,
    hvdcp_online: number
}

declare class Modem {

    constructor(options?: ModemOptions);

    public apiRequest(path: string, options?: ApiRequestOptions);

    public getMessages(options?: GetMessageOptions);

    public sendMessage(options?: SendMessageOptions): Promise<any>;

    public onMessage(callback: (message: string) => void);

    public connect(): string;

    public disconnect(): string;
    
    public trafficStatistics(): TrafficStatistics;
    
    public status(): TrafficStatistics;

}
