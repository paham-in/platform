//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'forum_message_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ForumMessageResponse {
  /// Returns a new [ForumMessageResponse] instance.
  ForumMessageResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ForumMessageResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory ForumMessageResponse.fromJson(Map<String, dynamic> json) => _$ForumMessageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ForumMessageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

