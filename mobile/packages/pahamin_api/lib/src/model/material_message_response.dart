//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'material_message_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class MaterialMessageResponse {
  /// Returns a new [MaterialMessageResponse] instance.
  MaterialMessageResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is MaterialMessageResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory MaterialMessageResponse.fromJson(Map<String, dynamic> json) => _$MaterialMessageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$MaterialMessageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

