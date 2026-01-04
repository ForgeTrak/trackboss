FROM public.ecr.aws/lambda/provided:al2

RUN yum install -y mysql gzip awscli && yum clean all

COPY backup.sh /backup.sh
RUN chmod +x /backup.sh

CMD ["/backup.sh"]
