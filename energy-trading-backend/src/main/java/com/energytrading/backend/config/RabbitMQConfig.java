package com.energytrading.backend.config;

import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${nav.rabbitmq.exchange}")
    private String exchange;

    @Value("${nav.rabbitmq.queue.transactions}")
    private String transactionsQueue;

    @Value("${nav.rabbitmq.queue.revenue}")
    private String revenueQueue;

    @Value("${nav.rabbitmq.routing-key.transactions}")
    private String transactionsRoutingKey;

    @Value("${nav.rabbitmq.routing-key.revenue}")
    private String revenueRoutingKey;

    @Bean
    public Queue transactionsQueue() {
        return QueueBuilder.durable(transactionsQueue).build();
    }

    @Bean
    public Queue revenueQueue() {
        return QueueBuilder.durable(revenueQueue).build();
    }

    @Bean
    public DirectExchange navExchange() {
        return new DirectExchange(exchange);
    }

    @Bean
    public Binding transactionsBinding() {
        return BindingBuilder
                .bind(transactionsQueue())
                .to(navExchange())
                .with(transactionsRoutingKey);
    }

    @Bean
    public Binding revenueBinding() {
        return BindingBuilder
                .bind(revenueQueue())
                .to(navExchange())
                .with(revenueRoutingKey);
    }

}