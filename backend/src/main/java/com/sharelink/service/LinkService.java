package com.sharelink.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.sharelink.model.ShareLink;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;


@Service
public class LinkService {
    private final DynamoDbClient dynamoDbClient;
    private final String tableName = "ShareLinks";

    public LinkService(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }
    
    public void incrementDownloadCount(String shortCode) {
        ShareLink link = getLink(shortCode);
        if (link == null) return;

        long current = Optional.ofNullable(link.getDownloadCount()).orElse(0L);
        link.setDownloadCount(current + 1);
        saveLink(link);  // overwrites the item
    }

    public void saveLink(ShareLink link) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("shortCode", AttributeValue.fromS(link.getShortCode()));
        item.put("s3Keys", AttributeValue.fromL(link.getS3Keys().stream().map(AttributeValue::fromS).toList()));
        item.put("originalFilenames", AttributeValue.fromL(link.getOriginalFilenames().stream().map(AttributeValue::fromS).toList()));
        item.put("fileSizes", AttributeValue.fromL(link.getFileSizes().stream().map(size -> AttributeValue.fromN(size.toString())).toList()));
        if (link.getUsername() != null) {
            item.put("username", AttributeValue.fromS(link.getUsername()));
        }
        item.put("createdAt", AttributeValue.fromN(link.getCreatedAt().toString()));
        item.put("expiresAt", AttributeValue.fromN(link.getExpiresAt().toString()));
        item.put("totalSize", AttributeValue.fromN(link.getTotalSize().toString()));
        item.put("downloadCount", AttributeValue.fromN(
            link.getDownloadCount() != null ? link.getDownloadCount().toString() : "0"
        ));
        if (link.getPassword() != null && !link.getPassword().isEmpty()) {
            item.put("password", AttributeValue.fromS(link.getPassword()));
        }

        PutItemRequest request = PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .build();

        dynamoDbClient.putItem(request);
    }

    @SuppressWarnings("UnnecessaryTemporaryOnConversionFromString")
    public ShareLink getLink(String shortCode) {
        GetItemRequest request = GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of("shortCode", AttributeValue.fromS(shortCode)))
                .build();

        Map<String, AttributeValue> item = dynamoDbClient.getItem(request).item();
        if (item == null || item.isEmpty()) return null;

        ShareLink link = new ShareLink();
        link.setShortCode(shortCode);
        link.setS3Keys(item.get("s3Keys").l().stream().map(AttributeValue::s).toList());
        link.setOriginalFilenames(item.get("originalFilenames").l().stream().map(AttributeValue::s).toList());
        link.setFileSizes(item.get("fileSizes").l().stream().map(attr -> Long.parseLong(attr.n())).toList());
        link.setCreatedAt(Long.parseLong(item.get("createdAt").n()));
        link.setExpiresAt(Optional.ofNullable(item.get("expiresAt")).map(AttributeValue::n).map(Long::parseLong).orElse(null));
        link.setTotalSize(Long.parseLong(item.get("totalSize").n()));
        if (item.containsKey("downloadCount")) {
            link.setDownloadCount(Long.parseLong(item.get("downloadCount").n()));
        } else {
            link.setDownloadCount(0L);  // default
        }
        if (item.containsKey("password") && item.get("password") != null) {
            link.setPassword(item.get("password").s());
        }
        if (item.containsKey("username")) link.setUsername(item.get("username").s());
        return link;
    }

    @SuppressWarnings("UnnecessaryTemporaryOnConversionFromString")
    public List<ShareLink> getLinksByUsername(String username) {
        QueryRequest request = QueryRequest.builder()
                .tableName(tableName)
                .indexName("UsernameIndex")  // Name of your GSI
                .keyConditionExpression("username = :username")
                .expressionAttributeValues(Map.of(":username", AttributeValue.fromS(username)))
                .build();

        List<Map<String, AttributeValue>> items = dynamoDbClient.query(request).items();

        return items.stream().map(item -> {
            ShareLink link = new ShareLink();
            link.setShortCode(item.get("shortCode").s());
            link.setS3Keys(item.get("s3Keys").l().stream().map(AttributeValue::s).toList());
            link.setOriginalFilenames(item.get("originalFilenames").l().stream().map(AttributeValue::s).toList());
            link.setFileSizes(item.get("fileSizes").l().stream().map(attr -> Long.parseLong(attr.n())).toList());
            link.setCreatedAt(Long.parseLong(item.get("createdAt").n()));
            link.setExpiresAt(Long.parseLong(item.get("expiresAt").n()));
            link.setTotalSize(Long.parseLong(item.get("totalSize").n()));
            if (item.containsKey("password")) link.setPassword(item.get("password").s());
            if (item.containsKey("username")) link.setUsername(item.get("username").s());
            if (item.containsKey("downloadCount")) link.setDownloadCount(Long.parseLong(item.get("downloadCount").n()));
            return link;
        }).toList();
    }

    public void deleteLink(String shortCode) {
        dynamoDbClient.deleteItem(builder -> builder
            .tableName(tableName)
            .key(Map.of("shortCode", AttributeValue.fromS(shortCode)))
        );
    }
}
