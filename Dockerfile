FROM alpine:3.19

COPY ./v2/ /netrunner-cards-json/v2/
COPY ./translations/ /netrunner-cards-json/translations/
COPY ./cycles.json ./factions.json ./mwl.json ./packs.json ./prebuilts.json ./rotations.json ./sides.json ./types.json /netrunner-cards-json/ 

ENTRYPOINT ["/bin/sh", "-c", "rm -rf /mnt/netrunner-cards-json/* && cp -r /netrunner-cards-json/* /mnt/netrunner-cards-json/ && exit"]
