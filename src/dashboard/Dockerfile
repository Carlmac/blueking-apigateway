ARG IMAGE=python
ARG TAG=3.10.15-slim-bullseye
FROM ${IMAGE}:${TAG}

# RUN sed -i "s/http/https/g" /etc/apt/sources.list

# replace the source
RUN echo 'deb https://mirrors.cloud.tencent.com/debian/ bullseye main contrib non-free\n\
deb-src https://mirrors.cloud.tencent.com/debian/ bullseye main contrib non-free\n\
deb https://mirrors.cloud.tencent.com/debian/ bullseye-updates main contrib non-free\n\
deb-src https://mirrors.cloud.tencent.com/debian/ bullseye-updates main contrib non-free\n\
deb https://mirrors.cloud.tencent.com/debian/ bullseye-backports main contrib non-free\n\
deb-src https://mirrors.cloud.tencent.com/debian/ bullseye-backports main contrib non-free\n\
deb https://mirrors.cloud.tencent.com/debian-security/ bullseye-security main contrib non-free\n\
deb-src https://mirrors.cloud.tencent.com/debian-security/ bullseye-security main contrib non-free\n\
' > /etc/apt/sources.list


RUN apt-get update && apt-get install -y --no-install-recommends libssl-dev libffi-dev \
    build-essential libc6-dev libjpeg-dev zlib1g-dev vim procps default-mysql-client curl zip unzip

# install kona-jdk maven
RUN curl -s "https://get.sdkman.io" | bash
RUN bash -c "source /root/.sdkman/bin/sdkman-init.sh && sdk install java 11.0.19-kona && rm -rf /root/.sdkman/archives/* && rm -rf /root/.sdkman/tmp/* && apt-get -y install maven"

# install mvn dep
# replace the source
RUN echo '<settings>\
      <mirrors>\
        <mirror>\
          <id>nexus-tencentyun</id>\
          <mirrorOf>*</mirrorOf>\
          <name>Nexus tencentyun</name>\
          <url>http://mirrors.cloud.tencent.com/nexus/repository/maven-public/</url>\
        </mirror>\
      </mirrors>\
    </settings>' > /usr/share/maven/conf/settings.xml
RUN mvn dependency:get -Dartifact=com.squareup.okhttp3:okhttp:4.12.0 && \
    mvn dependency:get -Dartifact=com.fasterxml.jackson.core:jackson-databind:2.13.4.1 && \
    mvn dependency:get -Dartifact=org.apache.maven.plugins:maven-compiler-plugin:3.8.1 && \
    mvn dependency:get -Dartifact=org.apache.maven.plugins:maven-jar-plugin:3.1.0

#ARG PYPI="https://pypi.org/simple/"
ARG PYPI="https://mirrors.tencent.com/pypi/simple"
RUN pip config set global.index-url "${PYPI}"

WORKDIR /app
ADD build/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt


ADD build /app

RUN apt-get clean autoclean && apt-get autoremove --yes && rm -rf /var/lib/{apt,dpkg,cache,log}/

CMD ["bash", "/app/bin/start.sh"]
