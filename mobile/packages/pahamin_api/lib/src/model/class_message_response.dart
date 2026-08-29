//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'class_message_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ClassMessageResponse {
  /// Returns a new [ClassMessageResponse] instance.
  ClassMessageResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ClassMessageResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory ClassMessageResponse.fromJson(Map<String, dynamic> json) => _$ClassMessageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ClassMessageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

