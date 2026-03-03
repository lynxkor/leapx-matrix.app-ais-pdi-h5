FROM nginx

ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY ./.env.* /etc/config/
COPY ./nginx.conf  /etc/nginx/

COPY ./dist /usr/share/nginx/html/

# 复制启动脚本
COPY ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
