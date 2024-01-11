FROM alpine:3.19

COPY . /repocontents/

ENTRYPOINT ["/bin/sh", "-c", "rm -rf /mnt/netrunner-cards-json/* && cp -r /repocontents/* /mnt/netrunner-cards-json/ && exit"]
