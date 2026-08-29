//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'push_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class PushErrorResponse {
  /// Returns a new [PushErrorResponse] instance.
  PushErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is PushErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory PushErrorResponse.fromJson(Map<String, dynamic> json) => _$PushErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$PushErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

