
module.exports = {
    "10.0.": {
        "/api/sms/sms-list": {
            path: "/sms/sms-list-contact",
            request: (request) => ({
                ...request,
                body: {
                    pageindex: request.body.PageIndex,
                    readcount: request.body.ReadCount,
                    sorttype: request.body.SortType,
                    unreadpreferred: request.body.UnreadPreferred,
                }
            })
        }
    }
}